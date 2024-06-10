import Joi from "joi";

class Validation {
    constructor(Object obj) {
        Joi.object(obj);
    }
}