//Model for custom error class
class HttpError extends Error {
  constructor(message, errorCode) {
    //Adds message property to instances based on this class
    super(message);
    //Adds a code property
    this.code = errorCode;
  }
}

module.exports = HttpError;
