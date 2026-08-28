use starknet::ContractAddress;

use crate::types::OpenNoteDeposit;

/// Entry stored per commitment in the escrow.
#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub struct CommitmentEntry {
    pub token: ContractAddress,
    pub amount: u128,
    pub claimed: bool,
}

/// Operation to perform on the escrow via STRK20 `privacy_invoke`.
#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub enum EscrowOperation {
    Deposit,
    Claim,
}

#[starknet::interface]
pub trait IBlindPayEscrow<TContractState> {
    /// Returns the commitment entry for a given hash. Zeroed if it does not exist.
    fn get_commitment(self: @TContractState, commitment_hash: felt252) -> CommitmentEntry;

    /// STRK20 anonymizer entrypoint — only callable by the registered privacy pool.
    ///
    /// **Deposit** — pool withdraws tokens here first, then invokes with commitment metadata.
    /// **Claim** — recipient proves secret preimage; escrow approves pool and returns note deposit.
    fn privacy_invoke(
        ref self: TContractState,
        operation: EscrowOperation,
        commitment_hash: felt252,
        token: ContractAddress,
        amount: u128,
        secret: felt252,
        note_id: felt252,
    ) -> Array<OpenNoteDeposit>;
}

/// Domain-separation tag for escrow commitment hashes (off-chain + on-chain).
pub const ESCROW_COMMITMENT_TAG: felt252 = 'ESCROW_COMMITMENT_TAG:V1';

pub mod errors {
    pub const ZERO_COMMITMENT_HASH: felt252 = 'ZERO_COMMITMENT_HASH';
    pub const ZERO_TOKEN: felt252 = 'ZERO_TOKEN';
    pub const ZERO_AMOUNT: felt252 = 'ZERO_AMOUNT';
    pub const COMMITMENT_EXISTS: felt252 = 'COMMITMENT_EXISTS';
    pub const COMMITMENT_NOT_FOUND: felt252 = 'COMMITMENT_NOT_FOUND';
    pub const ALREADY_CLAIMED: felt252 = 'ALREADY_CLAIMED';
    pub const CALLER_NOT_PRIVACY: felt252 = 'CALLER_NOT_PRIVACY';
    pub const ZERO_PRIVACY: felt252 = 'ZERO_PRIVACY';
}

/// Computes `poseidon(ESCROW_COMMITMENT_TAG, secret)` for invoice claim secrets.
pub fn compute_commitment_hash(secret: felt252) -> felt252 {
    core::poseidon::poseidon_hash_span([ESCROW_COMMITMENT_TAG, secret].span())
}

#[starknet::contract]
pub mod BlindPayEscrow {
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};

    use crate::escrow::{
        CommitmentEntry, EscrowOperation, IBlindPayEscrow, compute_commitment_hash, errors,
    };
    use crate::types::OpenNoteDeposit;

    #[storage]
    struct Storage {
        privacy_contract: ContractAddress,
        commitments: starknet::storage::Map<felt252, CommitmentEntry>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        DepositRecorded: DepositRecorded,
        Claimed: Claimed,
    }

    #[derive(Drop, starknet::Event)]
    struct DepositRecorded {
        commitment_hash: felt252,
        token: ContractAddress,
        amount: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct Claimed {
        commitment_hash: felt252,
        token: ContractAddress,
        amount: u128,
    }

    #[constructor]
    fn constructor(ref self: ContractState, privacy_contract: ContractAddress) {
        assert(privacy_contract.is_non_zero(), errors::ZERO_PRIVACY);
        self.privacy_contract.write(privacy_contract);
    }

    #[abi(embed_v0)]
    impl BlindPayEscrowImpl of IBlindPayEscrow<ContractState> {
        fn get_commitment(self: @ContractState, commitment_hash: felt252) -> CommitmentEntry {
            self.commitments.read(commitment_hash)
        }

        fn privacy_invoke(
            ref self: ContractState,
            operation: EscrowOperation,
            commitment_hash: felt252,
            token: ContractAddress,
            amount: u128,
            secret: felt252,
            note_id: felt252,
        ) -> Array<OpenNoteDeposit> {
            let privacy_addr = self.privacy_contract.read();
            assert(get_caller_address() == privacy_addr, errors::CALLER_NOT_PRIVACY);

            match operation {
                EscrowOperation::Deposit => {
                    assert(commitment_hash.is_non_zero(), errors::ZERO_COMMITMENT_HASH);
                    assert(token.is_non_zero(), errors::ZERO_TOKEN);
                    assert(amount.is_non_zero(), errors::ZERO_AMOUNT);

                    let existing = self.commitments.read(commitment_hash);
                    assert(existing.token.is_zero(), errors::COMMITMENT_EXISTS);

                    self
                        .commitments
                        .write(
                            commitment_hash,
                            CommitmentEntry { token, amount, claimed: false },
                        );

                    self.emit(Event::DepositRecorded(DepositRecorded { commitment_hash, token, amount }));

                    ArrayTrait::new()
                },
                EscrowOperation::Claim => {
                    let hash = compute_commitment_hash(secret);
                    let entry = self.commitments.read(hash);
                    assert(entry.token.is_non_zero(), errors::COMMITMENT_NOT_FOUND);
                    assert(!entry.claimed, errors::ALREADY_CLAIMED);

                    IERC20Dispatcher { contract_address: entry.token }
                        .approve(spender: privacy_addr, amount: entry.amount.into());

                    self
                        .commitments
                        .write(hash, CommitmentEntry { claimed: true, ..entry });

                    self.emit(Event::Claimed(Claimed { commitment_hash: hash, token: entry.token, amount: entry.amount }));

                    let mut out = ArrayTrait::new();
                    out
                        .append(
                            OpenNoteDeposit {
                                note_id, token: entry.token, amount: entry.amount,
                            },
                        );
                    out
                },
            }
        }
    }
}
