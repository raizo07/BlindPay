use blindpay_escrow::escrow::{
    EscrowOperation, IBlindPayEscrowDispatcher, IBlindPayEscrowDispatcherTrait,
    compute_commitment_hash,
};
use core::num::traits::Zero;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
use starknet::ContractAddress;

fn zero_addr() -> ContractAddress {
    0.try_into().unwrap()
}

fn addr(n: felt252) -> ContractAddress {
    n.try_into().unwrap()
}

#[starknet::interface]
trait IMockERC20<T> {
    fn mint(ref self: T, recipient: ContractAddress, amount: u256);
}

#[starknet::contract]
mod MockERC20 {
    use openzeppelin::token::erc20::{ERC20Component, DefaultConfig, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.erc20.initializer("Mock USDC", "USDC");
    }

    #[external(v0)]
    fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
        self.erc20.mint(recipient, amount);
    }
}

fn deploy_mock_token() -> ContractAddress {
    let contract = declare("MockERC20").unwrap().contract_class();
    let (address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    address
}

fn deploy_escrow(privacy: ContractAddress) -> ContractAddress {
    let contract = declare("BlindPayEscrow").unwrap().contract_class();
    let mut calldata = ArrayTrait::new();
    calldata.append(privacy.into());
    let (address, _) = contract.deploy(@calldata).unwrap();
    address
}

#[test]
fn test_compute_commitment_hash_deterministic() {
    let secret: felt252 = 12345;
    let h1 = compute_commitment_hash(secret);
    let h2 = compute_commitment_hash(secret);
    assert(h1 == h2, 'hash mismatch');
    assert(!h1.is_zero(), 'hash zero');
}

#[test]
fn test_deposit_stores_commitment() {
    let privacy = addr(0x111);
    let escrow = deploy_escrow(privacy);
    let token = deploy_mock_token();
    let secret: felt252 = 999;
    let commitment = compute_commitment_hash(secret);
    let amount: u128 = 1_000_000;

    start_cheat_caller_address(escrow, privacy);
    let dispatcher = IBlindPayEscrowDispatcher { contract_address: escrow };
    let result = dispatcher
        .privacy_invoke(
            EscrowOperation::Deposit, commitment, token, amount, 0, 0,
        );
    stop_cheat_caller_address(escrow);

    assert(result.len() == 0, 'deposit returns empty');

    let entry = dispatcher.get_commitment(commitment);
    assert(entry.token == token, 'token mismatch');
    assert(entry.amount == amount, 'amount mismatch');
    assert(!entry.claimed, 'should not be claimed');
}

#[test]
#[should_panic(expected: ('COMMITMENT_EXISTS',))]
fn test_deposit_rejects_duplicate() {
    let privacy = addr(0x111);
    let escrow = deploy_escrow(privacy);
    let token = deploy_mock_token();
    let commitment = compute_commitment_hash(42);

    start_cheat_caller_address(escrow, privacy);
    let dispatcher = IBlindPayEscrowDispatcher { contract_address: escrow };
    dispatcher.privacy_invoke(EscrowOperation::Deposit, commitment, token, 100, 0, 0);
    dispatcher.privacy_invoke(EscrowOperation::Deposit, commitment, token, 200, 0, 0);
    stop_cheat_caller_address(escrow);
}

#[test]
#[should_panic(expected: ('CALLER_NOT_PRIVACY',))]
fn test_deposit_rejects_non_privacy_caller() {
    let privacy = addr(0x111);
    let escrow = deploy_escrow(privacy);
    let token = deploy_mock_token();
    let commitment = compute_commitment_hash(7);

    let dispatcher = IBlindPayEscrowDispatcher { contract_address: escrow };
    dispatcher.privacy_invoke(EscrowOperation::Deposit, commitment, token, 100, 0, 0);
}

#[test]
fn test_claim_marks_claimed_and_returns_note_deposit() {
    let privacy = addr(0x111);
    let escrow = deploy_escrow(privacy);
    let token = deploy_mock_token();
    let secret: felt252 = 555;
    let commitment = compute_commitment_hash(secret);
    let amount: u128 = 500_000;
    let note_id: felt252 = 0xabc;

    // Fund escrow (simulates pool withdraw leg)
    let token_dispatcher = IMockERC20Dispatcher { contract_address: token };
    token_dispatcher.mint(escrow, amount.into());

    start_cheat_caller_address(escrow, privacy);
    let dispatcher = IBlindPayEscrowDispatcher { contract_address: escrow };
    dispatcher.privacy_invoke(EscrowOperation::Deposit, commitment, token, amount, 0, 0);

    let claim_result = dispatcher
        .privacy_invoke(EscrowOperation::Claim, 0, zero_addr(), 0, secret, note_id);
    stop_cheat_caller_address(escrow);

    assert(claim_result.len() == 1, 'one deposit instruction');
    let deposit = *claim_result.at(0);
    assert(deposit.note_id == note_id, 'note id');
    assert(deposit.token == token, 'claim token');
    assert(deposit.amount == amount, 'claim amount');

    let entry = dispatcher.get_commitment(commitment);
    assert(entry.claimed, 'must be claimed');
}

#[test]
#[should_panic(expected: ('ALREADY_CLAIMED',))]
fn test_claim_rejects_double_claim() {
    let privacy = addr(0x111);
    let escrow = deploy_escrow(privacy);
    let token = deploy_mock_token();
    let secret: felt252 = 888;
    let commitment = compute_commitment_hash(secret);
    let amount: u128 = 100;

    token_dispatcher_mint(token, escrow, amount);

    start_cheat_caller_address(escrow, privacy);
    let dispatcher = IBlindPayEscrowDispatcher { contract_address: escrow };
    dispatcher.privacy_invoke(EscrowOperation::Deposit, commitment, token, amount, 0, 0);
    dispatcher.privacy_invoke(EscrowOperation::Claim, 0, zero_addr(), 0, secret, 0x1);
    dispatcher.privacy_invoke(EscrowOperation::Claim, 0, zero_addr(), 0, secret, 0x2);
    stop_cheat_caller_address(escrow);
}

fn token_dispatcher_mint(token: ContractAddress, recipient: ContractAddress, amount: u128) {
    let token_dispatcher = IMockERC20Dispatcher { contract_address: token };
    token_dispatcher.mint(recipient, amount.into());
}

#[test]
fn test_constructor_rejects_zero_privacy() {
    let contract = declare("BlindPayEscrow").unwrap().contract_class();
    let mut calldata = ArrayTrait::new();
    calldata.append(zero_addr().into());
    let result = contract.deploy(@calldata);
    assert(result.is_err(), 'zero privacy fails');
}

#[test]
#[should_panic(expected: ('COMMITMENT_NOT_FOUND',))]
fn test_claim_rejects_wrong_secret() {
    let privacy = addr(0x111);
    let escrow = deploy_escrow(privacy);
    let token = deploy_mock_token();
    let secret: felt252 = 111;
    let commitment = compute_commitment_hash(secret);

    start_cheat_caller_address(escrow, privacy);
    let dispatcher = IBlindPayEscrowDispatcher { contract_address: escrow };
    dispatcher.privacy_invoke(EscrowOperation::Deposit, commitment, token, 100, 0, 0);
    dispatcher.privacy_invoke(EscrowOperation::Claim, 0, zero_addr(), 0, 999, 0x1);
    stop_cheat_caller_address(escrow);
}
