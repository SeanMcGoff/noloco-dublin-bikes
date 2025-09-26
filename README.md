# Noloco Dublin Bikes Project

## Methodology

The main core of this problem is effective type inferencing. Given a JSON type (string/number/bool/null), I needed to coerce it into the sensible field type. This came with a lot of complexity as I couldn't use a singlular value from each field to type-check. The types are checked in the following order:

**BOOLEAN**: If every value in a field is either a primitive boolean, or is the string equivalent "true/false", then the field gets returned as boolean.

**DATE**: If every value of a field of JSON type string can be parsed by the JS Date library as a date, then the field is assumed as a DATE.

**INTEGER**: If every value of a field is numeric AND no value is fractional/Inf/-Inf, then the fiel is assumed as an INTEGER

**FLOAT**: If every value of a field is numeric, but not already defined as INTEGER, then the field is assumed as a FLOAT

**OPTION**: If the number of unique strings in a field is less than 10 (arbitrary threshold), then the field is assumed as an OPTION

**TEXT**: If all else fails, the field is assumed as TEXT

## Running

This project uses _bun_ as its runtime. To run the server, type:

```
bun start
```

## Testing

The two endpoints available are _/schema_, and _/data_. _/schema_ can be tested in the browser, but _/data_ can be tested with a cURL command like so:

```sh
curl -i -X POST http://localhost:3000/data \
        -H "Content-Type: application/json" \
        -d '{"where":{"address": {"eq": "Heuston Station (Central)"}}}'
```

## Things to improve if I had more time

- There is a lot of duplicate code for type validation. I would move all data-specific type-casting functions to a single file, then have any type validation code just check if the value is not null
- Duplicate fields are not getting merged (name and address, for example)
- Currently, the filtering does not work with dates. This would require type-checking on dates and handling them specifically
- Beyond multiple filters, I wasn't able to get to many of the extra features, although I'll be ready to explain how I can implement them in the subsequent interview.
