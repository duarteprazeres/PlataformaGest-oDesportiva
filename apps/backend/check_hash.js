const bcrypt = require('bcrypt');
const hash = '$2b$10$/XRdHS/xI.Kt00GFjfVbbuq/73rOr/VFPLDhvQjkRJBR0bUBFyFhq';
const pass = '123456';

bcrypt.compare(pass, hash).then(result => {
    console.log('Match:', result);
});
