import React, { useState } from 'react'
import { Message, Grid, Form, Button, Container } from 'semantic-ui-react'
import logo from 'images/logo.png'
import { Helmet } from 'react-helmet'
import { gql, useMutation } from '@apollo/client'
import { saveJWT } from 'utils'
import { Link, useHistory } from 'react-router-dom'
import './Signup.scss'
import moment from 'moment-timezone'

import {
  DateInput,
} from 'semantic-ui-calendar-react';

const CREATE_ACCOUNT_MUTATION = gql`
mutation CreateUser($firstName: String!, $lastName: String!, $phoneNumber: String!, $emailAddress: String!, $password: String!, $birthDate: Date!)  {
  createUser(firstName: $firstName, lastName: $lastName, phoneNumber: $phoneNumber, emailAddress: $emailAddress, password: $password, birthDate: $birthDate) {
    success
  }
}
`

const LOGIN_MUTATION = gql`
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
      const [birthDate, setBirthDate] = useState(null);

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

    const [signupUser] = useMutation(CREATE_ACCOUNT_MUTATION, {
        onCompleted: (data) => {
            loginUser({
                variables: { emailAddress: emailAddress, password: password },
            })
            ///setProcessing(false)
            //setError(false)
            //saveJWT(data.tokenAuth.token)
            //history.push('/lobby')
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
            variables: { emailAddress, password, birthDate: moment(birthDate).format("YYYY-MM-DD"), phoneNumber, firstName, lastName },
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
                                <Message.Header>Error creating account</Message.Header>
                                <p>There was a problem creating an account.</p>
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
                                    <DateInput
          placeholder="Birth date"
          value={birthDate}
                                        icon={false}
                                        dateFormat="MM/DD/YYYY"
                                        label='Birth date'
                                        required
                                        closable={true}
                                        maxDate={moment().subtract(18, 'years')}
                                        startMode='year'
          iconPosition="left"
                                onChange={(e,d) => setBirthDate(d.value)}
        />
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
