import React, { useState } from 'react'
import { Message, Grid, Form, Button, Container } from 'semantic-ui-react'
import logo from 'images/logo.png'
import { Helmet } from 'react-helmet'
import { gql, useMutation } from '@apollo/client'
import { saveJWT } from 'utils'
import { useHistory } from 'react-router-dom'
import './Login.scss'

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
    const [error, setError] = useState(false)
    const [processing, setProcessing] = useState(false)

    const [loginUser] = useMutation(LOGIN_MUTATION, {
        onCompleted: (data) => {
            setProcessing(false)
            setError(false)
            saveJWT(data.tokenAuth.token)
            history.push('/lobby')
        },
        onError: (data) => {
            setProcessing(false)
            setError(true)
        },
    })

    const handleSubmit = (evt) => {
        evt.preventDefault()
        setProcessing(true)
        setError(false)
        loginUser({
            variables: { emailAddress: emailAddress, password: password },
        })
    }

    return (
        <Container id="ul-login">
            <Helmet>
                <title>Login</title>
            </Helmet>
            <div className="main-grid">
                <Grid centered columns={1}>
                    <Grid.Column width={6}>
                        <img alt="" src={logo} className="logo" />
                        {error && (
                            <Message negative>
                                <Message.Header>Login invalid</Message.Header>
                                <p>
                                    Your email address or password is incorrect.
                                </p>
                            </Message>
                        )}
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
                                disabled={processing}
                                loading={processing}
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
