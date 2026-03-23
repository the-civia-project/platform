/// Handle format aligned with apps/ui/validation/handle.ts (`@` + leading letter, etc.).
/// Stored handles include the leading `@` (max 64 characters total).
pub fn is_valid_handle(handle: &str) -> bool {
    let Some(rest) = handle.strip_prefix('@') else {
        return false;
    };
    if rest.is_empty() || rest.len() > 63 {
        return false;
    }
    let bytes = rest.as_bytes();
    if !bytes[0].is_ascii_alphabetic() {
        return false;
    }
    if rest.len() == 1 {
        return true;
    }
    if rest.contains("..") || rest.contains("--") || rest.contains(".-") || rest.contains("-.") {
        return false;
    }
    let last = *bytes.last().unwrap();
    if last == b'.' || last == b'-' {
        return false;
    }
    rest.chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
}

pub fn is_valid_location(location: &str) -> bool {
    let trimmed = location.trim();
    !trimmed.is_empty() && trimmed.len() <= 120
}
