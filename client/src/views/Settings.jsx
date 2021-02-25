import React, { useEffect, useState } from 'react'
import {
    Header,
    Menu,
    Message,
    Grid,
    List,
    Form,
    Button,
    Container,
} from 'semantic-ui-react'
import logo from 'images/logo.png'
import { Helmet } from 'react-helmet'
import { useQuery, gql, useMutation } from '@apollo/client'
import { parseQuery, saveJWT } from 'utils'
import { useParams, useLocation, Link, useHistory } from 'react-router-dom'
import moment from 'moment-timezone'
import './Settings.scss'

const GET_ME_QUERY = gql`
    query {
        me {
            firstName
            lastName
            email
            dateJoined
        }
    }
`

const Account = () => {
    const { data } = useQuery(GET_ME_QUERY)
    return (
        <Form loading={!data}>
            <Header as="h2">Account</Header>
            <Header as="h3">Personal information</Header>
            {data && (
                <List>
                    <List.Item>
                        <List.Icon name="user" />
                        <List.Content>
                            {data.me.firstName} {data.me.lastName}
                        </List.Content>
                    </List.Item>
                    <List.Item>
                        <List.Icon name="mail" />
                        <List.Content>{data.me.email}</List.Content>
                    </List.Item>
                    <List.Item>
                        <List.Icon name="star" />
                        <List.Content>
                            {moment(data.me.dateJoined).format('MMMM Do YYYY')}
                        </List.Content>
                    </List.Item>
                </List>
            )}
        </Form>
    )
}

const Deposit = () => {
    return (
        <>
            <Header as="h2">Deposit</Header>
            <div>
                <Button size="medium">Medium</Button>
            </div>
            <div>
                <Button size="medium">Medium</Button>
            </div>
            <div>
                <Button size="medium">Medium</Button>
            </div>
        </>
    )
}

const Withdraw = () => {
    return (
        <>
            <Header as="h2">Withdraw</Header>
            <p>
                Click{' '}
                <b>
                    <a href="mailto: support@underlinesports.com?subject=Withdrawal Request">
                        here
                    </a>
                </b>{' '}
                to submit a request to withdraw funds. We will process your
                request within 48 hours.
            </p>
        </>
    )
}

const Settings = () => {
    const history = useHistory()
    let { section } = useParams()
    const [activeItem, setActiveItem] = useState('')
    useEffect(() => {
        setActiveItem(section)
    }, [section])

    return (
        <div id="ul-settings">
            <Helmet>
                <title>Settings</title>
            </Helmet>
            <Grid columns={2}>
                <Grid.Row>
                    <Grid.Column width={3} className="nav-menu-col">
                        <Header as="h1">Settings</Header>
                        <Menu fluid secondary vertical>
                            <Menu.Item
                                name="account"
                                as={Link}
                                to="/settings/account"
                                active={activeItem === 'account'}
                            />
                            <Menu.Item
                                name="deposit"
                                as={Link}
                                to="/settings/deposit"
                                active={activeItem === 'deposit'}
                            />
                            <Menu.Item
                                name="withdraw"
                                as={Link}
                                to="/settings/withdraw"
                                active={activeItem === 'withdraw'}
                            />
                        </Menu>
                    </Grid.Column>
                    <Grid.Column width={13}>
                        {activeItem === 'account' && <Account />}
                        {activeItem === 'deposit' && <Deposit />}
                        {activeItem === 'withdraw' && <Withdraw />}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    )
}

export default Settings
