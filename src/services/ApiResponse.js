const ApiResponse = (res, status, message, data=null) => {
    const result = {
    message: message,
    data: data
    }
    return res.status(status).json(result);
}

export default ApiResponse;