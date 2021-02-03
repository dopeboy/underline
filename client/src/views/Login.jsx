import React from 'react'
import { Grid, Form, Button, Container, Image } from 'semantic-ui-react'
import logo from '../images/logo.png';
import './Login.css';
import {Helmet} from "react-helmet";
import {
  Link
} from "react-router-dom";


const Login = () => (
  <Container>
    <Helmet>
        <title>Login</title>
    </Helmet>
    <div className="main-grid">
        <Grid centered columns={1}>
            <Grid.Column width={6}>
              <img src={logo} className="ball" />
              <Form>
                <Form.Field>
                  <label>Email address</label>
                  <input type="email" placeholder='Email address' />
                </Form.Field>
                <Form.Field>
                  <label>Password</label>
                  <input type="password" placeholder='Password' />
                </Form.Field>
                <Button type='submit' fluid color="green" as={Link} to='/dashboard'>Submit</Button>
              </Form>
            </Grid.Column>
        </Grid>
    </div>

  </Container>
)

export default Login

