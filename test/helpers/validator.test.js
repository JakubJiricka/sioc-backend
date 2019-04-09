const should = require('should');
const Validate = require('../../src/helpers/validator');

const ValidationError = Validate.Error;

describe('Helper - Validator', () => {
    context('#is{FunctionName}', () => {
        it('should return validated value if validation pass', () => {
            should(Validate.isNull(null)).eql(null);
        });

        it('should throw ValidationError if validation fail', () => {
            should(() => {
                Validate.isNull(1);
            }).throw(ValidationError);
        });
    });

    context('#isNot{FunctionName}', () => {
        it('should return validated value ifNot validation pass', () => {
            should(Validate.isNotNull(1)).eql(1);
        });

        it('should throw ValidationError ifNot validation fail', () => {
            should(() => {
                Validate.isNotNull(null);
            }).throw(ValidationError);
        });
    });
});
