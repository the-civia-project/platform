use isocountry::CountryCode;
use platform_data::SUPPORTED_COUNTRIES_ALPHA2;
use std::sync::OnceLock;

#[derive(Debug, Clone)]
pub struct SupportedCountry {
    pub alpha2: &'static str,
    pub alpha3: &'static str,
    pub numeric: i32,
    pub name: &'static str,
}

fn build_supported_countries() -> Vec<SupportedCountry> {
    let mut countries = SUPPORTED_COUNTRIES_ALPHA2
        .iter()
        .map(|alpha2| {
            let code = CountryCode::for_alpha2(alpha2).unwrap_or_else(|_| {
                panic!("unknown ISO alpha-2 in supported countries manifest: {alpha2}");
            });
            SupportedCountry {
                alpha2: code.alpha2(),
                alpha3: code.alpha3(),
                numeric: code.numeric_id() as i32,
                name: code.name(),
            }
        })
        .collect::<Vec<_>>();
    countries.sort_by_key(|country| country.numeric);
    countries
}

/// Countries supported by the platform (`public.COUNTRY_NUMERIC_CODE` domain).
pub fn supported_countries() -> &'static [SupportedCountry] {
    static COUNTRIES: OnceLock<Vec<SupportedCountry>> = OnceLock::new();
    COUNTRIES.get_or_init(build_supported_countries)
}

pub fn allowed_numeric_codes() -> &'static [i32] {
    static NUMERIC: OnceLock<Vec<i32>> = OnceLock::new();
    NUMERIC.get_or_init(|| {
        supported_countries()
            .iter()
            .map(|country| country.numeric)
            .collect()
    })
}

pub fn is_allowed_numeric_code(code: i32) -> bool {
    allowed_numeric_codes().binary_search(&code).is_ok()
}

pub fn country_display_name(code: i32) -> Option<&'static str> {
    supported_countries()
        .iter()
        .find(|country| country.numeric == code)
        .map(|country| country.name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lists_twenty_seven_supported_countries_with_iso_fields() {
        let countries = supported_countries();
        assert_eq!(countries.len(), 27);
        let germany = countries.iter().find(|c| c.alpha2 == "DE").unwrap();
        assert_eq!(germany.alpha3, "DEU");
        assert_eq!(germany.numeric, 276);
        assert_eq!(germany.name, "Germany");
    }
}
