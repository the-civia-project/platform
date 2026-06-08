mod handle;

include!(concat!(env!("OUT_DIR"), "/generated.rs"));

pub use handle::{generate_suggested_handle, generate_user_tag_label};

#[cfg(test)]
mod tests {
    use super::{HANDLE_ADJECTIVES, HANDLE_ANIMALS, SUPPORTED_COUNTRIES_ALPHA2};
    use crate::generate_suggested_handle;

    #[test]
    fn manifest_counts() {
        assert_eq!(SUPPORTED_COUNTRIES_ALPHA2.len(), 27);
        assert_eq!(HANDLE_ADJECTIVES.len(), 1000);
        assert_eq!(HANDLE_ANIMALS.len(), 1000);
    }

    #[test]
    fn manifest_handle_words_are_lowercase_identifiers() {
        for word in HANDLE_ADJECTIVES.iter().chain(HANDLE_ANIMALS.iter()) {
            assert!(!word.is_empty());
            assert!(
                word.chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
            );
            assert!(word.as_bytes()[0].is_ascii_lowercase());
        }
    }

    #[test]
    fn supported_countries_alpha2_are_two_letter_codes() {
        for code in SUPPORTED_COUNTRIES_ALPHA2 {
            assert_eq!(code.len(), 2);
            assert!(code.chars().all(|c| c.is_ascii_uppercase()));
        }
    }

    #[test]
    fn all_suggested_handles_fit_varchar64() {
        for adjective in HANDLE_ADJECTIVES {
            for animal in HANDLE_ANIMALS {
                let handle = format!("@{adjective}.{animal}.1234");
                assert!(
                    handle.len() <= 64,
                    "handle too long ({}): {handle}",
                    handle.len()
                );
            }
        }
    }

    #[test]
    fn generated_suggested_handle_starts_with_at_and_fits_varchar64() {
        for _ in 0..50 {
            let handle = generate_suggested_handle();
            assert!(handle.starts_with('@'));
            assert!(handle.len() <= 64);
        }
    }
}
