import argon2 from 'argon2';


export const hashValue = async(value: string) => argon2.hash(value);

export const compareValue = async(value: string, hashedValue: string) => argon2.verify(hashedValue, value).catch(() => false);
