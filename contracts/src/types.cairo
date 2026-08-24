use starknet::ContractAddress;

/// Return payload for STRK20 `privacy_invoke` claim operations.
/// Matches the shape expected by the Starknet privacy pool when crediting open notes.
#[derive(Copy, Drop, Serde)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}
