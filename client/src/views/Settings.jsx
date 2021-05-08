import React, { useEffect, useState } from 'react'
import { PayPalButton } from 'react-paypal-button-v2'
import {
    Header,
    Menu,
    Modal,
    Icon,
    Success,
    Message,
    Grid,
    Divider,
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
import ResponsibleGaming from 'components/ResponsibleGaming'
import CustomerSupport from 'components/CustomerSupport'
import HowToPlay from 'components/HowToPlay'
import CreatorCode from 'components/CreatorCode'

const GET_ME_QUERY = gql`
    query {
        me {
            firstName
            lastName
            username
            email
            dateJoined
            freeToPlay
        }
    }
`

const RECORD_DEPOSIT_MUTATION = gql`
    mutation RecordDeposit(
        $amount: Float!
        $transactionDetails: String!
        $orderDetails: String!
    ) {
        recordDeposit(
            amount: $amount
            transactionDetails: $transactionDetails
            orderDetails: $orderDetails
        ) {
            success
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
                        <List.Icon name="info circle" />
                        <List.Content>@{data.me.username}</List.Content>
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
                    <List.Item>
                        <List.Icon name="settings" />
                        <List.Content>
                            {data.me.freeToPlay
                                ? 'Free to play'
                                : 'Pay to play'}
                        </List.Content>
                    </List.Item>
                </List>
            )}
        </Form>
    )
}

const Deposit = ({ updateMainComponent }) => {
    const { data } = useQuery(GET_ME_QUERY)
    const [selectedPaymentAmount, setSelectedPaymentAmount] = useState()
    const [
        depositSuccessModalVisible,
        setDepositSuccessModalVisible,
    ] = useState(false)
    const [processing, setProcessing] = useState(false)
    const history = useHistory()

    const [recordDeposit] = useMutation(RECORD_DEPOSIT_MUTATION, {
        onCompleted: (data) => {
            //setProcessing(false)
            //setError(false)
            // show modal
            updateMainComponent()
            setDepositSuccessModalVisible(true)
        },
        onError: (data) => {
            setProcessing(false)
            //setError(true)
        },
    })

    return (
        <Form className="ul-deposit" loading={!data}>
            <Header as="h2">Deposit</Header>
            {data && (
                <>
                    {data.me.freeToPlay && (
                        <p>
                            Because you are a free to play member, you do not
                            need to deposit any funds. You will be given $100
                            everyday.
                        </p>
                    )}
                    {!data.me.freeToPlay && (
                        <>
                            <p>
                                Select an option below. All of our payments are
                                processed securely through PayPal.
                            </p>
                            <div className="parent">
                                <Form loading={processing}>
                                    <Button
                                        active={selectedPaymentAmount === 5}
                                        className="amt-btn"
                                        type="button"
                                        toggle
                                        basic
                                        fluid
                                        size="large"
                                        onClick={() =>
                                            setSelectedPaymentAmount(5)
                                        }
                                    >
                                        $5
                                    </Button>
                                    <Button
                                        active={selectedPaymentAmount === 10}
                                        className="amt-btn"
                                        toggle
                                        basic
                                        type="button"
                                        fluid
                                        size="large"
                                        onClick={() =>
                                            setSelectedPaymentAmount(10)
                                        }
                                    >
                                        $10
                                    </Button>
                                    <Button
                                        active={selectedPaymentAmount === 20}
                                        className="amt-btn"
                                        toggle
                                        basic
                                        fluid
                                        type="button"
                                        size="large"
                                        onClick={() =>
                                            setSelectedPaymentAmount(20)
                                        }
                                    >
                                        $20
                                    </Button>
                                </Form>
                                <Divider />
                                <PayPalButton
                                    amount={selectedPaymentAmount}
                                    shippingPreference="NO_SHIPPING"
                                    onClick={() => {
                                        if (selectedPaymentAmount)
                                            setProcessing(true)
                                        return selectedPaymentAmount
                                    }}
                                    options={{
                                        clientId:
                                            process.env.NODE_ENV ===
                                            'development'
                                                ? 'AX5eD1ofG_dHeCpSVDbmlvoc9ghz53qS8eAwseFFNWOQxtGIb_H6ZD_uiOGrCSlCZRnwb41cjDPnIwo1'
                                                : 'Ad0GFGEqk719MEe6gKNnkiEwmapRr7tKRhgiCV56dQeX60G8_YD7pZ7oKvCRUW8a8ZIoweg6sFo8WzkN',
                                        disableFunding: 'credit',
                                    }}
                                    onSuccess={(details, data) => {
                                        recordDeposit({
                                            variables: {
                                                amount:
                                                    details.purchase_units[0]
                                                        .amount.value,
                                                transactionDetails: JSON.stringify(
                                                    details
                                                ),
                                                orderDetails: JSON.stringify(
                                                    data
                                                ),
                                            },
                                        })
                                    }}
                                />
                            </div>
                            <Modal
                                onClose={() =>
                                    setDepositSuccessModalVisible(false)
                                }
                                open={depositSuccessModalVisible}
                                size="small"
                            >
                                <Header>
                                    <Icon name="check " />
                                    Congratulations
                                </Header>
                                <Modal.Content>
                                    <p>
                                        You have successfully deposited funds
                                        into your Underline account. Click
                                        'Start playing' to begin.
                                    </p>
                                </Modal.Content>
                                <Modal.Actions>
                                    <Button
                                        color="green"
                                        onClick={() => {
                                            // Temporary hack
                                            //window.location.href = '/lobby'
                                            history.push('/lobby')
                                        }}
                                    >
                                        Start playing
                                    </Button>
                                </Modal.Actions>
                            </Modal>
                        </>
                    )}
                </>
            )}
        </Form>
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

const Settings = ({ updateMainComponent }) => {
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
            <Grid stackable columns={2}>
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
                            <Menu.Item
                                name="Responsible Gaming"
                                as={Link}
                                to="/settings/responsiblegaming"
                                active={activeItem === 'responsiblegaming'}
                            />
                            <Menu.Item
                                name="Customer Support"
                                as={Link}
                                to="/settings/customersupport"
                                active={activeItem === 'customersupport'}
                            />
                            <Menu.Item
                                name="How to Play"
                                as={Link}
                                to="/settings/howtoplay"
                                active={activeItem === 'howtoplay'}
                            />
                            <Menu.Item
                                name="Creator Code"
                                as={Link}
                                to="/settings/creatorcode"
                                active={activeItem === 'creatorcode'}
                            />
                        </Menu>
                    </Grid.Column>
                    <Grid.Column width={13}>
                        {activeItem === 'account' && <Account />}
                        {activeItem === 'deposit' && (
                            <Deposit
                                updateMainComponent={updateMainComponent}
                            />
                        )}
                        {activeItem === 'withdraw' && <Withdraw />}
                        {activeItem === 'responsiblegaming' && (
                            <ResponsibleGaming />
                        )}
                        {activeItem === 'customersupport' && (
                            <CustomerSupport />
                        )}
                        {activeItem === 'howtoplay' && <HowToPlay />}
                        {activeItem === 'creatorcode' && <CreatorCode />}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    )
}

export default Settings
