/**
 * UI Kit screen documenting the text-entry family and the `Select` picker.
 * The screen is split into sections so the visitor learns the chrome first, the
 * `type` preset catalogue second, multi-line `TextArea` third, and the drawer
 * picker last:
 *
 * - "TextInput" -- anatomy: default | with label | with helper | disabled.
 * - "Input types" -- preset bundles for common field kinds (email, phone,
 *   URL, number, password, search) accessed via the single `type` prop.
 * - "TextArea" -- multi-line sibling with `minRows` / `maxRows`.
 * - "Select" -- single-choice field with optional fuzzy search in the sheet and
 *   `xs` / `sm` / `md` trigger sizes.
 *
 * Every demo holds its own value state locally -- inputs are controlled, and
 * keeping the value-per-demo here mirrors how a real form would wire up. The
 * samples render full-width via a `sampleColumn` wrapper because inputs read
 * best as long pills rather than the auto-sized rows used elsewhere in the kit.
 */
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { TextArea, TextInput } from "../../components/Input";
import { Select, type SelectOption } from "../../components/Select";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
  Strong,
} from "../../components/Typography";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

/** Row data with a stable React `key`, used for both section lists. */
type DemoRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `input`.
 */
export default function InputScreen() {
  // One value per demo. Each example holds its own state so users can type
  // into one block without affecting any other. The disabled demo seeds a
  // value so the field has something to render when uneditable; the error
  // demo seeds an obviously-invalid email so the danger treatment is
  // visible on first paint.
  const [defaultValue, setDefaultValue] = useState("");
  const [labelValue, setLabelValue] = useState("");
  const [helperValue, setHelperValue] = useState("");
  const [errorEmail, setErrorEmail] = useState("aria@example");
  const [disabledValue, setDisabledValue] = useState("@aria.popescu");

  // Live, naive validation: as soon as the value contains a `.`, we assume
  // the user has typed a TLD and clear the error. Not a real email
  // validator -- just enough to show the fix-as-you-type flow.
  const errorEmailMessage =
    errorEmail.length > 0 && !errorEmail.includes(".")
      ? "Missing a top-level domain -- try aria@example.com."
      : undefined;
  // Per-type state for the "Input types" section. Each demo holds its own
  // value so the visitor can try one type without resetting the others.
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  // TextArea state -- one value per demo. The error demo seeds an empty
  // value so the validation message renders only after the user types.
  const [bodyValue, setBodyValue] = useState("");
  const [bioValue, setBioValue] = useState("");
  const [tallValue, setTallValue] = useState("");
  const [bodyErrorValue, setBodyErrorValue] = useState("");
  const bodyErrorMessage =
    bodyErrorValue.length > 0 && bodyErrorValue.length < 20
      ? `A bit more, please -- at least 20 characters (${bodyErrorValue.length}/20).`
      : undefined;

  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [selectErrorValue, setSelectErrorValue] = useState<string | null>(null);
  const [selectSizeXs, setSelectSizeXs] = useState<string | null>(null);
  const [selectSizeSm, setSelectSizeSm] = useState<string | null>(null);
  const [selectSizeMd, setSelectSizeMd] = useState<string | null>(null);

  const cityOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "ams", label: "Amsterdam", searchText: "NL AMS Netherlands" },
      { value: "bcn", label: "Barcelona", searchText: "ES BCN Catalonia" },
      { value: "ber", label: "Berlin", searchText: "DE BER Germany" },
      { value: "bru", label: "Brussels", searchText: "BE BRU Belgium" },
      { value: "dub", label: "Dublin", searchText: "IE DUB Ireland" },
      { value: "edi", label: "Edinburgh", searchText: "GB EDI Scotland UK" },
      { value: "lis", label: "Lisbon", searchText: "PT LIS Portugal" },
      { value: "lon", label: "London", searchText: "GB LON UK LHR" },
      { value: "mad", label: "Madrid", searchText: "ES MAD Spain" },
      { value: "mun", label: "Munich", searchText: "DE MUC Bavaria Germany" },
      { value: "par", label: "Paris", searchText: "FR PAR France CDG" },
      { value: "prg", label: "Prague", searchText: "CZ PRG Czechia" },
      { value: "rom", label: "Rome", searchText: "IT ROM Italy FCO" },
      { value: "vie", label: "Vienna", searchText: "AT VIE Austria" },
    ],
    [],
  );

  const selectSizeDemoOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "alpha", label: "Alpha" },
      { value: "beta", label: "Beta" },
      { value: "gamma", label: "Gamma" },
    ],
    [],
  );

  const selectErrorMessage =
    selectErrorValue !== null && selectErrorValue === "low"
      ? "Pick a higher priority for this demo."
      : undefined;

  const selectRows: DemoRow[] = useMemo(
    () => [
      {
        key: "select-sizes",
        name: "sizes (xs / sm / md)",
        summary: (
          <Description>
            The <Code>size</Code> prop scales the closed trigger — padding, label
            font size, and chevron. <Code>&quot;md&quot;</Code> matches the default{" "}
            <Strong>TextInput</Strong> rhythm; smaller presets fit dense toolbars.
          </Description>
        ),
        description: (
          <Description>
            Sheet contents are unchanged; only the field affordance shrinks. Constants
            for layout math ship as{" "}
            <Code>SELECT_TRIGGER_METRICS_PX</Code> /{" "}
            <Code>SELECT_TRIGGER_MIN_HEIGHT_PX</Code>.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Select size="sm" label="Plan" ... />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={[styles.sampleColumn, styles.selectSizeSamples]}>
            <Select
              size="xs"
              label="xs"
              sheetTitle="xs"
              placeholder="Pick one"
              options={selectSizeDemoOptions}
              value={selectSizeXs}
              onChange={setSelectSizeXs}
            />
            <Select
              size="sm"
              label="sm"
              sheetTitle="sm"
              placeholder="Pick one"
              options={selectSizeDemoOptions}
              value={selectSizeSm}
              onChange={setSelectSizeSm}
            />
            <Select
              size="md"
              label="md"
              sheetTitle="md"
              placeholder="Pick one"
              options={selectSizeDemoOptions}
              value={selectSizeMd}
              onChange={setSelectSizeMd}
            />
          </View>
        ),
      },
      {
        key: "select-short",
        name: "short list (no search)",
        summary: (
          <Description>
            Fewer than ten options keeps the sheet compact: no filter row, just
            tappable <Strong>rows</Strong>. The trigger reuses TextInput chrome
            so selects sit flush with neighbouring fields.
          </Description>
        ),
        description: (
          <Description>
            Search UI is driven by <Code>search=&quot;auto&quot;</Code> and{" "}
            <Code>searchThreshold</Code> (default 10). Drop below the threshold
            and the list scrolls instead of filtering.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Select label="Country" options={[{ value: "fr", label: "France" }, ...]} value={v} onChange={setV} placeholder="Pick one" sheetTitle="Country" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <Select
              label="Country"
              sheetTitle="Country"
              placeholder="Pick one"
              options={[
                { value: "fr", label: "France" },
                { value: "de", label: "Germany" },
                { value: "it", label: "Italy" },
                { value: "es", label: "Spain" },
                { value: "nl", label: "Netherlands" },
                { value: "pl", label: "Poland" },
                { value: "pt", label: "Portugal" },
                { value: "se", label: "Sweden" },
              ]}
              value={country}
              onChange={setCountry}
            />
          </View>
        ),
      },
      {
        key: "select-fuzzy",
        name: "long list + fuzzy search",
        summary: (
          <Description>
            Once the option count crosses the threshold, a search field appears
            at the top of the sheet and is focused automatically so typing can
            start immediately. The top match is highlighted as you type; on web,
            use arrow keys to move the highlight and Enter to confirm. Typing
            ranks rows by match confidence (ordered subsequence plus
            typo-tolerant edit distance) so &quot;mun&quot; still surfaces
            &quot;Munich&quot;, &quot;pariz&quot; can still find
            &quot;Paris&quot;, and country or airport codes in{" "}
            <Code>searchText</Code> match without appearing on the main label.
          </Description>
        ),
        description: (
          <Description>
            Optional <Code>searchText</Code> per option widens the haystack; the
            default haystack joins label + searchText. Try{" "}
            <Code>par</Code>, <Code>pariz</Code>, or <Code>de</Code> against
            the city list below.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Select options={cities} value={city} onChange={setCity} placeholder="City" sheetTitle="City" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <Select
              label="City"
              sheetTitle="City"
              placeholder="Pick a city"
              options={cityOptions}
              value={city}
              onChange={setCity}
            />
          </View>
        ),
      },
      {
        key: "select-force-search",
        name: "force search",
        summary: (
          <Description>
            Pass <Code>search=&#123;true&#125;</Code> to show the filter row even
            when the list is short -- the field is auto-focused the same way.
            Useful when options are few but dense (legal clauses, long labels)
            and typing beats scrolling.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Select search options={priorities} ... />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <Select
              label="Priority"
              sheetTitle="Priority"
              search
              placeholder="Choose priority"
              options={[
                { value: "urgent", label: "Urgent — same day" },
                { value: "high", label: "High — within 48h" },
                { value: "normal", label: "Normal — this week" },
                { value: "low", label: "Low — when convenient" },
              ]}
              value={priority}
              onChange={setPriority}
            />
          </View>
        ),
      },
      {
        key: "select-error",
        name: "with error",
        summary: (
          <Description>
            The same <Code>error</Code> prop contract as TextInput: danger
            border plus message, helper hidden while the error is set.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Select error={msg} helper="…" ... />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <Select
              label="Priority (validated)"
              sheetTitle="Priority"
              search
              placeholder="Pick priority"
              helper="Try choosing “Low” to see the error state."
              error={selectErrorMessage}
              options={[
                { value: "urgent", label: "Urgent" },
                { value: "high", label: "High" },
                { value: "normal", label: "Normal" },
                { value: "low", label: "Low" },
              ]}
              value={selectErrorValue}
              onChange={setSelectErrorValue}
            />
          </View>
        ),
      },
    ],
    [
      cityOptions,
      country,
      city,
      priority,
      selectErrorMessage,
      selectErrorValue,
      selectSizeDemoOptions,
      selectSizeMd,
      selectSizeSm,
      selectSizeXs,
    ],
  );

  const anatomyRows: DemoRow[] = useMemo(
    () => [
      {
        key: "default",
        name: "default",
        summary: (
          <Description>
            Bare-bones shape: just <Code>value</Code>,{" "}
            <Code>onChangeText</Code>, and a <Code>placeholder</Code>{" "}
            &mdash; no label, no helper, no extra layout to worry about.
          </Description>
        ),
        description: (
          <Description>
            The chrome is the kit's zinc-tinted pill with a hairline border
            that thickens to the theme foreground while the field is
            focused. Use when the surrounding UI already names the input
            (a search row in a toolbar, the lone field in a sheet).
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput value={v} onChangeText={setV} placeholder="What's on your mind?" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              value={defaultValue}
              onChangeText={setDefaultValue}
              placeholder="What's on your mind?"
            />
          </View>
        ),
      },
      {
        key: "with-label",
        name: "with label",
        summary: (
          <Description>
            Add a <Code>label</Code> to give the field a visible name above
            the chrome. The label also doubles as the field's
            accessibility name, so screen readers announce it on focus
            without any extra wiring.
          </Description>
        ),
        description: (
          <Description>
            Prefer a short noun phrase ("Display name", "Email", "Bio")
            over a sentence &mdash; labels read better when they describe
            the value, not the instruction.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput label="Display name" placeholder="@yourhandle" value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              label="Display name"
              placeholder="@yourhandle"
              value={labelValue}
              onChangeText={setLabelValue}
            />
          </View>
        ),
      },
      {
        key: "with-helper",
        name: "with helper",
        summary: (
          <Description>
            Add a <Code>helper</Code> to put a short supporting line under
            the field &mdash; the <Strong>proactive</Strong> half of
            feedback, paired with <Code>error</Code> for the{" "}
            <Strong>reactive</Strong> half.
          </Description>
        ),
        description: (
          <Description>
            Use for format hints ("3&ndash;24 characters, letters and
            numbers"), context ("Visible on your profile"), and one-line
            disclaimers. When an <Code>error</Code> is set the helper is
            hidden so the validation message reads on its own, then
            returns once the value clears.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput label="Bio" helper="Up to 160 characters. Visible on your profile." value={v} onChangeText={setV} maxLength={160} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              label="Bio"
              placeholder="Share a short blurb..."
              helper="Up to 160 characters. Visible on your profile."
              value={helperValue}
              onChangeText={setHelperValue}
              maxLength={160}
            />
          </View>
        ),
      },
      {
        key: "with-error",
        name: "with error",
        summary: (
          <Description>
            Pass <Code>error</Code> with a non-empty message to flip the
            field into error mode: the border swaps to the kit's danger
            colour and the helper line is replaced by the error string.
          </Description>
        ),
        description: (
          <Description>
            The border stays red regardless of focus while the error is
            set. The error is the single source of truth &mdash; derive it
            from your own validation pipeline and clear it (return{" "}
            <Code>undefined</Code> or <Code>""</Code>) once the value
            passes. The sample below clears as soon as a <Code>.</Code>{" "}
            lands in the value, mimicking the fix-as-you-type flow real
            forms use.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput type="email" label="Email" error={validate(v)} value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              type="email"
              label="Email"
              placeholder="you@example.com"
              helper="We'll only use it for sign-in and recovery."
              value={errorEmail}
              onChangeText={setErrorEmail}
              error={errorEmailMessage}
            />
          </View>
        ),
      },
      {
        key: "disabled",
        name: "disabled",
        summary: (
          <Description>
            Pass <Code>disabled</Code> to dim the entire field (chrome,
            label, helper) and block interaction.
          </Description>
        ),
        description: (
          <Description>
            The native input is rendered with{" "}
            <Code>editable=&#123;false&#125;</Code>, so taps don't summon
            the keyboard. Use when the value is computed elsewhere
            ("read-only"), when the field is waiting on another input
            ("Country picks the currency"), or while a network request is
            in flight.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput disabled label="Username" value="@aria.popescu" onChangeText={...} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              disabled
              label="Username"
              helper="Set during signup. Contact support to change it."
              value={disabledValue}
              onChangeText={setDisabledValue}
            />
          </View>
        ),
      },
    ],
    [
      defaultValue,
      labelValue,
      helperValue,
      errorEmail,
      errorEmailMessage,
      disabledValue,
    ],
  );

  const typeRows: DemoRow[] = useMemo(
    () => [
      {
        key: "email",
        name: `type="email"`,
        summary: (
          <Description>
            Email-address keyboard,{" "}
            <Code>autoCapitalize="none"</Code>, and{" "}
            <Code>autoCorrect=&#123;false&#125;</Code> so the address isn't
            mangled. Reach for this any time the value should pass an{" "}
            <Code>x@y</Code> validator.
          </Description>
        ),
        description: (
          <Description>
            The iOS keyboard promotes <Code>@</Code> and <Code>.</Code> as
            primary keys; Android shows the equivalent domain shortcuts.
            Use for sign-in, recovery, and invite forms.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput type="email" label="Email" placeholder="you@example.com" value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              type="email"
              label="Email"
              placeholder="you@example.com"
              helper="We'll only use it for sign-in and recovery."
              value={emailValue}
              onChangeText={setEmailValue}
              returnKeyType="done"
            />
          </View>
        ),
      },
      {
        key: "phone",
        name: `type="phone"`,
        summary: (
          <Description>
            Phone-pad keyboard (digits plus <Code>+</Code>, <Code>*</Code>,{" "}
            <Code>#</Code>), <Code>autoCapitalize="none"</Code>, and{" "}
            <Code>autoCorrect=&#123;false&#125;</Code>.
          </Description>
        ),
        description: (
          <Description>
            No on-the-fly number formatting yet &mdash; the field stores
            whatever the user types. Pair with a helper that hints at the
            expected shape (e.g. "Include country code") until the kit
            ships a formatter.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput type="phone" label="Phone" placeholder="+40 712 345 678" value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              type="phone"
              label="Phone"
              placeholder="+40 712 345 678"
              helper="Include the country code, no spaces required."
              value={phoneValue}
              onChangeText={setPhoneValue}
              maxLength={20}
            />
          </View>
        ),
      },
      {
        key: "url",
        name: `type="url"`,
        summary: (
          <Description>
            URL keyboard,{" "}
            <Code>autoCapitalize="none"</Code>, and{" "}
            <Code>autoCorrect=&#123;false&#125;</Code>.
          </Description>
        ),
        description: (
          <Description>
            iOS promotes <Code>/</Code> and <Code>.com</Code> shortcuts;
            Android shows the equivalent domain-friendly layout. The field
            stores the raw value &mdash; including any scheme the user
            types &mdash; so you decide whether to require{" "}
            <Code>https://</Code>, default it in on blur, or leave the
            input shape free.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput type="url" label="Website" placeholder="https://example.com" value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              type="url"
              label="Website"
              placeholder="https://example.com"
              helper="Shown on your profile; we'll add https:// if you omit it."
              value={urlValue}
              onChangeText={setUrlValue}
            />
          </View>
        ),
      },
      {
        key: "number",
        name: `type="number"`,
        summary: (
          <Description>
            Numeric keyboard &mdash; digits only on iOS, locale-aware
            numpad on Android &mdash; paired with{" "}
            <Code>autoCapitalize="none"</Code> and{" "}
            <Code>autoCorrect=&#123;false&#125;</Code>.
          </Description>
        ),
        description: (
          <Description>
            Use for PINs, OTP codes, quantities, and other digit-only
            inputs. Pair with <Code>maxLength</Code> for fixed-length codes
            so the OS knows when the user is done.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput type="number" label="Verification code" maxLength={6} value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              type="number"
              label="Verification code"
              placeholder="123456"
              helper="6 digits -- we just texted them to your phone."
              value={numberValue}
              onChangeText={setNumberValue}
              maxLength={6}
              returnKeyType="done"
            />
          </View>
        ),
      },
      {
        key: "password",
        name: `type="password"`,
        summary: (
          <Description>
            Masks the value as dots, disables suggestions, and turns off
            auto-capitalize and auto-correct.
          </Description>
        ),
        description: (
          <Description>
            The kit doesn't ship a "show password" toggle yet &mdash; pair
            with a <Code>helper</Code> for the password rules (length,
            character classes, etc.) so the user knows what they're typing
            without having to see it.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput type="password" label="Password" value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              helper="Use a mix of letters, numbers, and a symbol or two."
              value={passwordValue}
              onChangeText={setPasswordValue}
              returnKeyType="done"
            />
          </View>
        ),
      },
      {
        key: "search",
        name: `type="search"`,
        summary: (
          <Description>
            Standard text keyboard with the on-screen{" "}
            <Code>returnKeyType="search"</Code> wired so the submit press
            fires <Code>onSubmitEditing</Code>.
          </Description>
        ),
        description: (
          <Description>
            <Code>autoCapitalize="none"</Code> and{" "}
            <Code>autoCorrect=&#123;false&#125;</Code> keep queries
            verbatim. No leading magnifier or clear button in this first
            pass &mdash; add adornments once the kit ships them.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextInput type="search" placeholder="Search" value={v} onChangeText={setV} onSubmitEditing={runQuery} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextInput
              type="search"
              placeholder="Search posts, people, places..."
              value={searchValue}
              onChangeText={setSearchValue}
            />
          </View>
        ),
      },
    ],
    [emailValue, phoneValue, urlValue, numberValue, passwordValue, searchValue],
  );

  const textAreaRows: DemoRow[] = useMemo(
    () => [
      {
        key: "ta-default",
        name: "default",
        summary: (
          <Description>
            Three-row multi-line field with the same chrome as{" "}
            <Code>TextInput</Code>. The native input grows up to{" "}
            <Code>maxRows</Code> as the user types and then scrolls
            internally; the caret pins to the top of the pill on every
            platform.
          </Description>
        ),
        description: (
          <Description>
            Reach for <Code>TextArea</Code> whenever the value is prose
            that wraps across lines &mdash; post composer bodies, bios,
            comments. The single-line <Code>type</Code> preset catalogue
            is deliberately absent: a multi-line phone or email is
            incoherent.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextArea value={v} onChangeText={setV} placeholder="What's happening?" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextArea
              value={bodyValue}
              onChangeText={setBodyValue}
              placeholder="What's happening?"
            />
          </View>
        ),
      },
      {
        key: "ta-with-label",
        name: "with label + helper",
        summary: (
          <Description>
            Same label / helper slots as <Code>TextInput</Code>. The
            helper sits muted under the field and is replaced by the
            error message when validation fires.
          </Description>
        ),
        description: (
          <Description>
            Prefer a short noun phrase for the label and a one-liner for
            the helper &mdash; long sentences in the helper start
            competing with the body content for the user's attention.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextArea label="Bio" helper="Up to 240 characters. Visible on your profile." value={v} onChangeText={setV} maxLength={240} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextArea
              label="Bio"
              placeholder="Share a short blurb about yourself..."
              helper="Up to 240 characters. Visible on your profile."
              value={bioValue}
              onChangeText={setBioValue}
              maxLength={240}
            />
          </View>
        ),
      },
      {
        key: "ta-min-max-rows",
        name: "minRows + maxRows",
        summary: (
          <Description>
            Pin a tall starting size with <Code>minRows</Code> and a
            scrolling ceiling with <Code>maxRows</Code>. The default is{" "}
            <Code>3</Code> / <Code>8</Code>; widen both for full-page
            composers, drop them for tight inline replies.
          </Description>
        ),
        description: (
          <Description>
            Heights are derived from a fixed per-row metric, so the
            field's <Code>minHeight</Code> / <Code>maxHeight</Code> follow
            the kit's font ramp without the caller having to think in
            pixels.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextArea minRows={6} maxRows={14} value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextArea
              label="Draft"
              placeholder="Long-form here..."
              minRows={6}
              maxRows={14}
              value={tallValue}
              onChangeText={setTallValue}
            />
          </View>
        ),
      },
      {
        key: "ta-with-error",
        name: "with error",
        summary: (
          <Description>
            Pass <Code>error</Code> with a non-empty message to flip the
            border to danger and replace the helper line with the
            validation feedback.
          </Description>
        ),
        description: (
          <Description>
            The sample below requires at least 20 characters; the error
            clears the moment the value passes &mdash; same fix-as-you-type
            flow as the single-line variant.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<TextArea label="Body" error={validate(v)} value={v} onChangeText={setV} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.sampleColumn}>
            <TextArea
              label="Body"
              placeholder="At least 20 characters..."
              value={bodyErrorValue}
              onChangeText={setBodyErrorValue}
              error={bodyErrorMessage}
            />
          </View>
        ),
      },
    ],
    [bodyValue, bioValue, tallValue, bodyErrorValue, bodyErrorMessage],
  );

  return (
    <Page>
      <Lede>
        The kit's text-entry family shares one chrome surface across{" "}
        <Code>TextInput</Code> (single-line), <Code>TextArea</Code> (multi-line),
        and <Code>Select</Code> (drawer picker with the same pill trigger).
        All three carry an optional <Code>label</Code> above, an optional{" "}
        <Code>helper</Code> below, and a focus-state border that thickens to the
        theme foreground while the field is active &mdash; text fields do so on
        keyboard focus; the select trigger does so while the sheet is open or
        the pill is pressed. Values are <Strong>controlled</Strong> (parent owns
        state), and an <Code>error</Code> prop swaps the border to the kit's
        danger red and replaces the helper with validation copy whenever it's
        set. <Code>TextInput</Code> adds a <Code>type</Code> preset catalogue for
        common keyboard bundles; <Code>TextArea</Code> trades that for{" "}
        <Code>minRows</Code> / <Code>maxRows</Code>; <Code>Select</Code> opens a{" "}
        <Code>Drawer</Code> of options and turns on fuzzy search automatically
        once the list is long enough (or when <Code>search</Code> is forced on).
        Treat <Code>helper</Code> as proactive guidance and <Code>error</Code> as
        reactive feedback &mdash; only one is visible at a time on the text
        siblings; the select follows the same rule.
      </Lede>

      <Section
        title="TextInput"
        subtitle="Chrome anatomy -- placeholder, label, helper, error, disabled."
      >
        {anatomyRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === anatomyRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Input types"
        subtitle="Preset bundles via the type prop -- keyboard, casing, correct, secure, return-key."
      >
        {typeRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === typeRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="TextArea"
        subtitle="Multi-line sibling -- same chrome, plus minRows / maxRows for the row-driven height contract."
      >
        {textAreaRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === textAreaRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Select"
        subtitle="Single-choice drawer picker -- auto search on long lists, optional searchText, forced search."
      >
        {selectRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === selectRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  /**
   * Full-width sample slot. {@link ExampleBlock}'s default `sampleRow` is a
   * wrapping horizontal flex row that shrinks to its content -- perfect for
   * auto-sized buttons but wrong for inputs, which want the full page width
   * so the focus ring and label stretch the way they would in a real form.
   * The wrapper here forces 100% width with `alignSelf: "stretch"` to match
   * the convention used in {@link CardsScreen}.
   */
  sampleColumn: {
    width: "100%",
    alignSelf: "stretch",
  },
  selectSizeSamples: {
    gap: 16,
  },
});
