import {OAuth2Client} from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function verify(res, token) {
    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
    } catch (error) {
        console.error(error);
    }
    const payload = ticket.getPayload();    
    return payload;
}