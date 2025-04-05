import { describe, it, beforeAll, afterAll } from 'vitest';
import { connectToDatabase, cleanDb, closeDatabase } from '../src/config/db.js';
import { PORT } from '../src/constants/env.js';
import app from '../src/app.js';
import { Server } from 'http';
import * as pactum from  'pactum';
import { uuid } from 'pactum-matchers'
import { registerSchema } from '../src/auth/authSchema.js';
import { BAD_REQUEST, CONFLICT, CREATED, NOT_FOUND, UNAUTHORIZED } from '../src/constants/http.js';

describe('App e2e', () => {
  let server: Server;
  beforeAll(async () => {
    await connectToDatabase();
    await cleanDb();
    server = app.listen(PORT);
    pactum.request.setBaseUrl(`http://localhost:${PORT}/api`);
  });

  afterAll(async () => {
    server.close();
    await closeDatabase();
  });

  describe('Auth', () => {
    const seller1: registerSchema = {
      email: "yusufnuru@gmail.com",
      password: "password",
      firstName: "Yusuf",
      lastName: "Nuru",
      phoneNumber: "+2347030000000",
      role: "seller",
      confirmPassword: "password",
    }

    describe('Register', () => {

      it('should throw if email is empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            confirmPassword: seller1.confirmPassword,
            password: seller1.password,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
            phoneNumber: seller1.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [{
              path: "email",
              message: "Required"
            }]
          })
      });

      it('should throw if email is invalid', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: 'invalid-email',
            confirmPassword: seller1.confirmPassword,
            password: seller1.password,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
            phoneNumber: seller1.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "email", message: "Invalid email" }] })
      });

      it('should throw if first name is empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            confirmPassword: seller1.confirmPassword,
            password: seller1.password,
            lastName: seller1.lastName,
            phoneNumber: seller1.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "firstName", message: "Required" }] })
      });

      it('should throw if last name is empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            confirmPassword: seller1.confirmPassword,
            password: seller1.password,
            firstName: seller1.firstName,
            phoneNumber: seller1.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "lastName", message: "Required" }] })
      });

      it('should throw if phone number is empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            confirmPassword: seller1.confirmPassword,
            password: seller1.password,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "phoneNumber", message: "Required" }] })
      });

      it('should throw if phone number is invalid', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            confirmPassword: seller1.confirmPassword,
            password: seller1.password,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
            phoneNumber: '2432ikr23'
          })
          .expectStatus(BAD_REQUEST)
          .inspect()
          .expectJsonLike({ errors: [{ path: "phoneNumber", message: "Invalid phone number" }] })
      });

      it('should throw if password is empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            confirmPassword: seller1.confirmPassword,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
            phoneNumber: seller1.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "password", message: "Required" }] })
      });


      it('should throw if password is invalid', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            password: '123',
            confirmPassword: seller1.confirmPassword,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
            phoneNumber: seller1.phoneNumber
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({
            errors: [
              { path: "password", message: "String must contain at least 6 character(s)" },
              { path: "confirmPassword", message: "Passwords do not match" }
            ]
          })
      });

      it('should throw if confirm password is empty', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            password: seller1.password,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
            phoneNumber: seller1.phoneNumber,
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "confirmPassword", message: "Required" }] })
      });

      it('should throw if confirm password does not match', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: seller1.email,
            password: seller1.password,
            firstName: seller1.firstName,
            lastName: seller1.lastName,
            phoneNumber: seller1.phoneNumber,
            confirmPassword: 'invalid-password'
          })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "confirmPassword", message: "Passwords do not match" }] })
      });

      it('should register a seller1', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(seller1)
          .expectStatus(CREATED)
          .expectJsonMatch({
            user: {
              id: uuid(),
              "email": seller1.email,
              "role": seller1.role,
              "verificationCode": uuid(),
            },
            message: "Account created successfully. Verification email has been sent to you"
          })
          .stores('code', 'user.verificationCode')
          .inspect()
      })

      it('should throw if user already exists', async () => {
        await pactum
          .spec()
          .post('/auth/register')
          .withBody(seller1)
          .expectStatus(CONFLICT)
          .expectJsonLike({ message: "Email already exists" })
      })
    })
    
    describe('Login', () => {

      it('should throw if email is empty', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({ password: seller1.password })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "email", message: "Required" }] })
      });

      it('should throw if email is invalid', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: 'yusuf@', password: seller1.password })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "email", message: "Invalid email" }] })
      });

      it('should throw if password is empty', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: seller1.email })
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: "password", message: "Required" }] })
          .inspect()
      });

      it('should throw if password is invalid', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({email: seller1.email, password: "1562"}).expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors: [{ path: 'password', message: 'String must contain at least 6 character(s)' }] })
      })

      it("should throw if email is not found", async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: 'yusuf@gmail.cy', password: seller1.password })
          .expectStatus(UNAUTHORIZED)
          .expectJsonLike({ message: 'Invalid email or password' })
      })

      it('should throw if password is incorrect', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: seller1.email, password: 'invalid-password' })
          .expectStatus(UNAUTHORIZED)
          .expectJsonLike({ message: 'Invalid email or password' });
      });

      it('should throw if account is unverified', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: seller1.email, password: seller1.password })
          .expectStatus(UNAUTHORIZED)
          .expectJsonLike({ message: 'Account not verified. Verification email has been sent to you again' })
      });

      it('should throw if verification code is invalid type ', async () => {
        await pactum
          .spec()
          .get('/auth/email/verify/{code}')
          .withPathParams('code', 123456789)
          .expectStatus(BAD_REQUEST)
          .expectJsonLike({ errors:
            [{ path: "verificationCode", message: "String must contain at least 36 character(s)" }]
          })
      });

      it ('should throw if verification code is invalid or expired', async () => {
        await pactum
          .spec()
          .get('/auth/email/verify/{code}')
          .withPathParams('code', '1c54e10b-5e6d-49ee-94b5-639a14504bcd')
          .expectStatus(NOT_FOUND)
          .expectJsonLike({ message: "Invalid OR expired verification code" })
      });

      it('should verify email and login', async () => {
        await pactum
          .spec()
          .get('/auth/email/verify/{code}')
          .withPathParams('code', '$S{code}')
          .expectStatus(200)
          .expectJsonMatch({ message: `Email successfully verified for ${seller1.email}` })
          .expectCookiesLike({
            accessToken: /.+/,
            refreshToken: /.+/
          })
          .stores('accessToken', 'cookies.accessToken')
          .stores('refreshToken', 'cookies.refreshToken')
      });

      it('should login a verified user', async () => {
        await pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: seller1.email, password: seller1.password })
          .expectStatus(200)
          .expectJsonMatch({
            message: 'Login successful'
          })
          .expectCookiesLike({
            accessToken: /.+/,
            refreshToken: /.+/
          })
          .stores('accessToken', 'cookies.accessToken')
          .stores('refreshToken', 'cookies.refreshToken')
      })
    })
  })
});
