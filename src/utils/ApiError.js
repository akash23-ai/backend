class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went Wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode;
        this.data = null
        this.message = message
        this.success = false  // API ERROR HANDLE
        this.errors = errors

        // what is inside this.data  => Assignment



        if(stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


export { ApiError }