use rand::RngExt;

use crate::{HANDLE_ADJECTIVES, HANDLE_ANIMALS};

/// Suggested public handle: `@adjective.animal.number` (e.g. `@whimsical.axolotl.42`).
pub fn generate_suggested_handle() -> String {
    let mut rng = rand::rng();
    let adjective = random_item(HANDLE_ADJECTIVES, &mut rng);
    let animal = random_item(HANDLE_ANIMALS, &mut rng);
    let number = rng.random_range(1..10_000);
    format!("@{adjective}.{animal}.{number}")
}

/// Default account tag label: `adjective_animal` (e.g. `whimsical_axolotl`).
pub fn generate_user_tag_label() -> String {
    let mut rng = rand::rng();
    let adjective = random_item(HANDLE_ADJECTIVES, &mut rng);
    let animal = random_item(HANDLE_ANIMALS, &mut rng);
    format!("{adjective}_{animal}")
}

fn random_item<'a>(items: &'a [&str], rng: &mut impl RngExt) -> &'a str {
    let index = (rng.random::<u32>() as usize) % items.len();
    items[index]
}
