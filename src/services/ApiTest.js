const ApiTest = (res, data) => {
    const message = {
        message: "Testing",
        data: data
    }
    return res.status(200).json(message);
}

export default ApiTest;