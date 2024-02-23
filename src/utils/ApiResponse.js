class ApiResponse {
    constructor(
        statusCode,
        data,
        message = "Success"
    ){
        this.statusCode =statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}


let res = new ApiResponse(
    500,"whatsUp0"
)

console.log(res)

export {ApiResponse}
