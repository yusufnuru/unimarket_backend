import { describe, it, beforeAll, afterAll } from 'vitest';
import { connectToDatabase, cleanDb, closeDatabase } from '../src/config/db.js';
import { PORT } from '../src/constants/env.js';
import app from '../src/app.js';
import { Server } from 'http';
import * as pactum from  'pactum';
import { uuid } from 'pactum-matchers'
import { registerSchema, loginSchema } from '../src/auth/authSchema.js';
import { BAD_REQUEST, CREATED } from '../src/constants/http.js';

describe('App e2e', () => {
  let server: Server;
  beforeAll(async () => {
    await connectToDatabase();
    await cleanDb();
    server = app.listen(PORT);
    pactum.request.setBaseUrl(`http://localhost:${PORT}`);
  });

  afterAll(async () => {
    server.close();
    await closeDatabase();
  });

  describe('Auth', () => {
    const verifiedUser: registerSchema = {
      email: "yusufnuru@gmail.com",
      password: "password",
      firstName: "Yusuf",
      lastName: "Nuru",
      phoneNumber: "+2347030000000",
      role: "seller",
      confirmPassword: "password",
      verified: true,
    }

    const loginDto: loginSchema = {
      email: 'yusufnuru@gmail.com',
      password: 'password',
    }

    describe('Register', () => {

      it('should throw if email is empty', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            confirmPassword: verifiedUser.confirmPassword,
            password: verifiedUser.password,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "email",
                message: "Required"
              }
            ]
          })
      });

      it('should throw if email is invalid', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: 'invalid-email',
            confirmPassword: verifiedUser.confirmPassword,
            password: verifiedUser.password,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "email",
                message: "Invalid email"
              }
            ]
          })
      });

      it('should throw if first name is empty', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            confirmPassword: verifiedUser.confirmPassword,
            password: verifiedUser.password,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "firstName",
                message: "Required"
              }
            ]
          })
      });

      it('should throw if last name is empty', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            confirmPassword: verifiedUser.confirmPassword,
            password: verifiedUser.password,
            firstName: verifiedUser.firstName,
            phoneNumber: verifiedUser.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "lastName",
                message: "Required"
              }
            ]
          })
      });

      it('should throw if phone number is empty', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            confirmPassword: verifiedUser.confirmPassword,
            password: verifiedUser.password,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "phoneNumber",
                message: "Required"
              }
            ]
          })
      });

      it('should throw if phone number is invalid', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            confirmPassword: verifiedUser.confirmPassword,
            password: verifiedUser.password,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: '2432ikr23'
          })
          .expectStatus(BAD_REQUEST)
          .inspect()
          .expectJsonLike({
            errors: [
              {
                path: "phoneNumber",
                message: "Invalid phone number"
              }
            ]
          })
      });

      it('should throw if password is empty', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            confirmPassword: verifiedUser.confirmPassword,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "password",
                message: "Required"
              }
            ]
          })
      });


      it('should throw if password is invalid', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            password: '123',
            confirmPassword: verifiedUser.confirmPassword,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "password",
                message: "String must contain at least 6 character(s)"
              },
              {
                path: "confirmPassword",
                message: "Passwords do not match"
              }
            ]
          })
      });

      it('should throw if confirm password is empty', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            password: verifiedUser.password,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber,
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "confirmPassword",
                message: "Required"
              }
            ]
          })
      });

      it('should throw if confirm password does not match', async () => {
        await  pactum
          .spec()
          .post('/api/auth/register')
          .withBody({
            email: verifiedUser.email,
            password: verifiedUser.password,
            firstName: verifiedUser.firstName,
            lastName: verifiedUser.lastName,
            phoneNumber: verifiedUser.phoneNumber,
            confirmPassword: 'invalid-password'
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              {
                path: "confirmPassword",
                message: "Passwords do not match"
              }
            ]
          })
      });

      it('should register a user', async () => {
        await pactum
          .spec()
          .post('/api/auth/register')
          .withBody(verifiedUser)
          .expectStatus(CREATED)
          .expectJsonMatch({
            "user": {
              id: uuid(),
              "email": verifiedUser.email,
              "role": verifiedUser.role || "buyer",
            }
          })
          .inspect()
      })
    })
  })
});
