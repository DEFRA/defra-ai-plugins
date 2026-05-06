// Planted file used by the secret-scan hook test.
// Contains a deliberately-fake-but-pattern-matching AWS access key id.
// The hook should detect this on Write and block the change.
//
// DO NOT REPLACE THIS WITH A REAL KEY. The pattern-match is what matters.
const AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE'
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'

module.exports = { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY }
