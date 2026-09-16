# Default Data

Tember seeds the supplied backup once when a browser first opens a new local database. Existing unrelated records remain in place. A one-time additive upgrade gives existing Debbie and Jake seed databases the missing supplied records and Mochi without overwriting any local record. The seed marker remains when the user deletes all pet data, so deleted defaults do not return.

## Pet details

- Debbie is a male leopard tortoise estimated to be 1.5 years old at her first measurement on 2023-02-18.
- Jake is a male leopard tortoise estimated to be 1 year old at his first measurement on 2023-03-06.
- Mochi is a female cat with a birth date of 2026-03-01 and an estimated age of 0.4 years at the first measurement.

The displayed estimated age uses the latest measurement date:

```text
age at latest record = age at first measurement
                     + (latest date - first date) / 365.2425 days
```

Future measurements therefore update the estimate without changing the stored baseline age.

## Source

The seed is the supplied Tember backup with 310 measurements: 148 for Debbie, 146 for Jake, and 16 for Mochi. It preserves the backup's stored gram values, calendar dates, notes, and duplicate same-day Mochi records. Mochi is labelled as a cat in the seed to match the supplied pet context.

The included portraits for Debbie, Jake, and Mochi are polished square crops of their supplied photos. A photo selected in the pet form is stored locally and takes precedence over the included portrait.
