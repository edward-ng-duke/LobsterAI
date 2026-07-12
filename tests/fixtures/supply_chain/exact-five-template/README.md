# Synthetic exact-five evidence template

Every file in this directory is synthetic test data. It contains no image,
registry, credential, customer, or production evidence. The fixture helper
binds these templates to a temporary Git repository, generates exactly five
image records, five SPDX 2.3 documents, and five Grype documents, then
recomputes every evidence-file SHA-256.

The complete tracked template directory must remain at or below 500 KiB.
