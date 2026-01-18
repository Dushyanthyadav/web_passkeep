import CryptoJS from 'crypto-js';


// Generates a random salt(used during Signup)
export const generateSalt = () => {
    return CryptoJS.lib.WordArray.random(128/8).toString();
};

// Hast the password (used for Login)
export const hashPassword = (password: string, salt: string) => {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 1000
    }).toString();
}

// Encrypt Data (Used when dding a password)
export const encryptData = (data: string, masterKey: string) => {
    const iv = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const encrypted = CryptoJS.AES.encrypt(data, masterKey, {
        iv: CryptoJS.enc.Hex.parse(iv)
    }).toString();

    return { encrypted, iv };
}

// Decrypt Data (used when viewing passwords);
export const decryptData = (encrypted: string, iv: string, masterKey: string) => {
    const bytes = CryptoJS.AES.decrypt(encrypted, masterKey, {
        iv: CryptoJS.enc.Hex.parse(iv)
    });
    return bytes.toString(CryptoJS.enc.Utf8);
};


