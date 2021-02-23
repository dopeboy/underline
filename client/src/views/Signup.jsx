import React, { useState } from 'react'
import { Message, Grid, Form, Button, Container } from 'semantic-ui-react'
import logo from 'images/logo.png'
import { Helmet } from 'react-helmet'
import { gql, useMutation } from '@apollo/client'
import { saveJWT } from 'utils'
import { Link, useHistory } from 'react-router-dom'
import './Signup.scss'
import SemanticDatepicker from 'react-semantic-ui-datepickers';
import 'react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css';

const CREATE_ACCOUNT_MUTATION = gql`
    mutation TokenAuth($emailAddress: String!, $password: String!) {
        tokenAuth(email: $emailAddress, password: $password) {
            token
            payload
            refreshExpiresIn
        }
    }
`

const Signup = () => {
    const history = useHistory()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [emailAddress, setEmailAddress] = useState('')
    const [password, setPassword] = useState('')
      const [currentDate, setNewDate] = useState(null);
      const onChange = (event, data) => setNewDate(data.value);

    const [error, setError] = useState(false)
    const [processing, setProcessing] = useState(false)

    const [signupUser] = useMutation(CREATE_ACCOUNT_MUTATION, {
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
        signupUser({
            variables: { emailAddress: emailAddress, password: password },
        })
    }

    return (
        <Container id="ul-signup">
            <Helmet>
                <title>Sign up</title>
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
                                <label>First name</label>
                                <input
                                    type="text"
                                    size="large"
                                    placeholder="First name"
                                    required
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                />
                            </Form.Field>
                            <Form.Field required>
                                <label>Last name</label>
                                <input
                                    type="text"
                                    size="large"
                                    placeholder="Last name"
                                    required
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                />
                            </Form.Field>
                            <Form.Field required>
                                <label>Phone number</label>
                                <input
                                    type="text"
                                    size="large"
                                    placeholder="Phone number"
                                    required
                                    onChange={(e) =>
                                        setPhoneNumber(e.target.value)
                                    }
                                />
                            </Form.Field>
                            <Form.Field required>
                                <label>Birth date</label>
                                <SemanticDatepicker onChange={onChange} />
                            </Form.Field>
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
                                Sign up
                            </Button>
                            <p>
                                Already have an account?{' '}
                                <Link to="/">Login here.</Link>
                            </p>
                        </Form>
                    </Grid.Column>
                </Grid>
            </div>
        </Container>
    )
}

export default Signup
