# DFA Email & Password Validator

A student portal page that validates an email address and a password using Deterministic Finite Automata (DFA). It shows the exact state path for every input and reads the result aloud.

Built as a mini project for **Automata Theory & Compiler Design**.

**Live demo:** https://karupothulamalliswari3112.github.io/DFA-Email-Password-Validator/

## Features

- **Email DFA** that accepts only addresses ending in `@ashokacollege.in`
- **Password DFA** that checks length of at least 8, uppercase, lowercase, digit and symbol
- **State path display** with the character read at each step, animated one state at a time
- **Clear rejection reasons** such as "expected 'c' but found 'g'"
- **Voice-over** using the Web Speech API, with voice selection, speed control, on/off switch, test and replay buttons
- **Live password checklist** and strength meter while typing
- Show/Hide password button
- Enter key submits the form
- Responsive layout and reduced-motion support

## How the DFAs Work

### Email DFA

| State | Meaning |
|-------|---------|
| q0 | Start |
| q1 | Reading the name part (letters, digits, `.`, `_`, `-`) |
| q2 | `@` has been read |
| q3 to q18 | Matching each letter of `ashokacollege.in` |
| q18 | **Accepting state** |
| qTRAP | Dead state. Any wrong or extra character ends here. |

### Password DFA

A state is written as `q<bits>,<n>`:

- The four bits show whether an uppercase letter, lowercase letter, digit and symbol have been seen.
- `n` is the length read so far (capped at 8).
- This gives 16 x 9 = 144 states, and the only accepting state is `q1111,8`.

## Tech Used

HTML, CSS, JavaScript (no libraries), Web Speech API

## Project Structure

```
DFA-Email-Password-Validator/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run Locally

1. Clone or download this repository.
2. Open `index.html` in Chrome or Edge (voice works best there).

To use another college domain, change the `DOMAIN` constant at the top of `script.js`.

## Author

Karupothula Malliswari: [GitHub](https://github.com/karupothulamalliswari3112)
