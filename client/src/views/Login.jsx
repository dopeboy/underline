import React, { useState } from 'react'
import { Grid, Form, Button, Container } from 'semantic-ui-react'
import logo from 'images/logo.png'
import './Login.css'
import { Helmet } from 'react-helmet'
import { gql, useMutation } from '@apollo/client'
import { saveJWT } from 'utils'
import { useHistory } from 'react-router-dom'

const LOGIN_MUTATION = gql`
    mutation TokenAuth($emailAddress: String!, $password: String!) {
        tokenAuth(email: $emailAddress, password: $password) {
            token
            payload
            refreshExpiresIn
        }
    }
`

const Login = () => {
    const history = useHistory()
    const [emailAddress, setEmailAddress] = useState('')
    const [password, setPassword] = useState('')
    const [loginUser] = useMutation(LOGIN_MUTATION, {
        onCompleted: (data) => {
            saveJWT(data.tokenAuth.token)
            history.push('/dashboard')
        },
        onError: (data) => {
            console.error(data)
        },
    })

    const handleSubmit = (evt) => {
        evt.preventDefault()
        loginUser({
            variables: { emailAddress: emailAddress, password: password },
        })
    }

    return (
        <Container>
            <Helmet>
                <title>Login</title>
            </Helmet>
            <div className="main-grid">
                <Grid centered columns={1}>
                    <Grid.Column width={6}>
                        <img alt="" src={logo} className="logo" />
                        <Form onSubmit={handleSubmit}>
                            <Form.Field required>
                                <label>Email address</label>
                                <input
                                    type="email"
                                    size="large"
                                    placeholder="Email address"
                                    required
                                    onChange={(e) =>
                                        setEmailAddress(e.target.value)
                                    }
                                />
                            </Form.Field>
                            <Form.Field required>
                                <label>Password</label>
                                <input
                                    size="large"
                                    type="password"
                                    placeholder="Password"
                                    required
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </Form.Field>
                            <Button
                                type="submit"
                                size="large"
                                fluid
                                color="green"
                            >
                                Login
                            </Button>
                            <p>
                                Don't have an account?{' '}
                                <a href="mailto: zach@underlinesports.com">
                                    Ask us
                                </a>{' '}
                                for an invite.
                            </p>
                        </Form>
                    </Grid.Column>
                </Grid>
            </div>
        </Container>
    )
}

export default Login
