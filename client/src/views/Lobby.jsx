import React, { useState, Component } from 'react'
import {
    Divider,
    Form,
    Progress,
    Message,
    Segment,
    Grid,
    Label,
    Icon,
    List,
    Modal,
    Card,
    Image,
    Header,
    Input,
    Container,
    Button,
    Dropdown,
    Menu,
} from 'semantic-ui-react'
import logo from '../images/logo.png'
import { gql, useApolloClient, useQuery } from '@apollo/client'
import moment from 'moment-timezone'
import { Helmet } from 'react-helmet'
import './Lobby.scss'
import { useHistory } from 'react-router-dom'

const GET_TODAYS_SUBLINES_QUERY = gql`
    query {
        todaysSublines {
            id
            nbaPointsLine
            line {
                id
                player {
                    id
                    name
                    headshotUrl
                    team {
                        id
                    }
                }
                game {
                    datetime
                    homeTeam {
                        abbreviation
                    }
                    awayTeam {
                        abbreviation
                    }
                }
            }
        }
    }
`

const GET_CURRENT_DATE_QUERY = gql`
    query currentDate {
        currentDate
    }
`

const CHECK_APPROVED_LOCATION_QUERY = gql`
    query ApprovedLocation($lat: Float!, $lng: Float!) {
        approvedLocation(lat: $lat, lng: $lng)
    }
`

const CREATE_SLIP_MUTATION = gql`
    mutation CreateSlip($picks: [PickType]!, $entryAmount: Int!) {
        createSlip(picks: $picks, entryAmount: $entryAmount) {
            success
        }
    }
`

const GET_ME_QUERY = gql`
    query {
        me {
            firstName
            lastName
            walletBalance
        }
    }
`

const PlayerList = ({ picks, addOrRemovePick }) => {
    const { data } = useQuery(GET_TODAYS_SUBLINES_QUERY)
    return (
        <Form loading={!data}>
            <Card.Group>
                {data &&
                    data.todaysSublines.map((subline) => {
                        const pick = picks.filter((e) => {
                            return e.id === subline.id
                        })[0]

                        return (
                            <Card key={subline.id}>
                                <Image
                                    size="small"
                                    src={subline.line.player.headshotUrl}
                                    wrapped
                                    ui={false}
                                />
                                <Card.Content>
                                    <Card.Header>
                                        {subline.line.player.name}
                                    </Card.Header>
                                    <Card.Meta>
                                        <span className="date">
                                            Points:{' '}
                                            {parseFloat(
                                                subline.nbaPointsLine
                                            ).toFixed(1)}
                                        </span>
                                    </Card.Meta>
                                    <Card.Description>
                                        {
                                            subline.line.game.awayTeam
                                                .abbreviation
                                        }{' '}
                                        @{' '}
                                        {
                                            subline.line.game.homeTeam
                                                .abbreviation
                                        }{' '}
                                        -{' '}
                                        {moment
                                            .tz(
                                                subline.line.game.datetime,
                                                moment.tz.guess()
                                            )
                                            .format('h:mma z')}
                                    </Card.Description>
                                </Card.Content>
                                <Card.Content extra>
                                    <Button.Group size="large" fluid>
                                        <Button
                                            className="over-under-btn"
                                            color={
                                                pick && !pick.under
                                                    ? 'black'
                                                    : ''
                                            }
                                            content="Over"
                                            onClick={() =>
                                                addOrRemovePick(subline, false)
                                            }
                                        />
                                        <Button.Or />
                                        <Button
                                            className="over-under-btn"
                                            content="Under"
                                            color={
                                                pick && pick.under
                                                    ? 'black'
                                                    : null
                                            }
                                            onClick={() =>
                                                addOrRemovePick(subline, true)
                                            }
                                        />
                                    </Button.Group>
                                </Card.Content>
                            </Card>
                        )
                    })}
            </Card.Group>
        </Form>
    )
}

const LobbyHeader = () => {
    const { data } = useQuery(GET_CURRENT_DATE_QUERY)
    return (
        <Header as="h1">
            Featured Players:{' '}
            {data && moment(data.currentDate).format('MMMM Do YYYY')}
        </Header>
    )
}

const Lobby = () => {
    const [tab, setTab] = useState('lobby')
    const [picks, setPicks] = useState([])
    const [percent, setPercent] = useState(0)
    const [multiplier, setMultiplier] = useState('1x')
    const [payout, setPayout] = useState('')
    const [entryAmount, setEntryAmount] = useState('')
    const [checking, setChecking] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [errorModalVisible, setErrorModalVisible] = useState({
        open: false,
        header: '',
        message: '',
    })
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(
        false
    )
    const [
        insufficientFundsModalVisible,
        setInsufficentFundsModalVisible,
    ] = useState(false)
    const [payoutErrorVisible, setPayoutErrorVisible] = useState(false)
    const client = useApolloClient()
    const history = useHistory()

    const addOrRemovePick = (subline, under) => {
        const pickIndex = picks.findIndex((e) => e.id === subline.id)
        let newPicks = []

        // If the pick already exists, remove it
        if (pickIndex != -1) {
            var array = [...picks] // deep copy

            // Check if user is changing the over/under. If so, just update that.
            if (array[pickIndex].under != under) {
                array[pickIndex].under = under
            }

            // Else, remove it
            else {
                array.splice(pickIndex, 1)
            }

            newPicks = array
            setPicks(newPicks)
        }

        // New pick. Set the attribute
        else {
            // If we're at 5 picks, tell the user and don't proceed
            if (picks.length === 5) {
                setErrorModalVisible({
                    open: true,
                    header: 'Too many picks',
                    message: 'You can only choose five picks.',
                })
                newPicks = picks
            } else {
                newPicks = [...picks, Object.assign({}, subline, { under })]
                setPicks(newPicks)
            }
        }

        // Update multiplier
        if (newPicks.length == 0) {
            setPercent(0)
            setMultiplier(`${getMultiplier(newPicks.length)}x`)
            setPayout(entryAmount ? entryAmount : '')
        } else if (newPicks.length === 1) {
            setPercent(10)
            setMultiplier(`${getMultiplier(newPicks.length)}x`)
            setPayout(entryAmount ? entryAmount : '')
        } else if (newPicks.length === 2) {
            setPercent(25)
            setMultiplier(`${getMultiplier(newPicks.length)}x`)
            setPayout(
                entryAmount ? entryAmount * getMultiplier(newPicks.length) : ''
            )
        } else if (newPicks.length === 3) {
            setPercent(50)
            setMultiplier(`${getMultiplier(newPicks.length)}x`)
            setPayout(
                entryAmount ? entryAmount * getMultiplier(newPicks.length) : ''
            )
        } else if (newPicks.length === 4) {
            setPercent(75)
            setMultiplier(`${getMultiplier(newPicks.length)}x`)
            setPayout(
                entryAmount ? entryAmount * getMultiplier(newPicks.length) : ''
            )
        } else if (newPicks.length === 5) {
            setPercent(100)
            setMultiplier(`${getMultiplier(newPicks.length)}x`)
            setPayout(
                entryAmount ? entryAmount * getMultiplier(newPicks.length) : ''
            )
        }
    }

    const getMultiplier = (numPicks) => {
        if (numPicks == 0) {
            return 1
        } else if (numPicks === 1) {
            return 1
        } else if (numPicks === 2) {
            return 3
        } else if (numPicks === 3) {
            return 6
        } else if (numPicks === 4) {
            return 10
        } else if (numPicks === 5) {
            return 20
        }
    }

    // (1) Check if they entered a payout amount
    // (2) Check if entry amount is <= $10
    // (3) Check that there are atleast two teams involved
    // (4) Check the location of the user
    // (5) Check if user has linked a payment method
    // (6) Check if user has sufficients funds in their wallet
    const checkPicks = async () => {
        setChecking(true)
        let lat,
            lng = null

        // (1)
        if (!payout) {
            setPayoutErrorVisible(true)
            setChecking(false)
            return
        }

        if (entryAmount > 10) {
            setPayoutErrorVisible(true)
            setErrorModalVisible({
                open: true,
                header: 'Max $10 entry',
                message: 'We only allow a maximum of $10 for entry',
            })
            setChecking(false)
            return
        }

        // (2)
        let teamIds = []
        for (let i = 0; i < picks.length; i++) {
            const teamId = picks[i].line.player.team.id

            if (!teamIds.includes(teamId)) {
                teamIds.push(teamId)
            }
        }

        if (teamIds.length < 2) {
            // Error
            setErrorModalVisible({
                open: true,
                header: 'Two teams must be involved',
                message: 'You must select picks that span at least two teams.',
            })
            setChecking(false)
            return
        }

        // (3)
        if (!'geolocation' in navigator) {
            setErrorModalVisible({
                open: true,
                header: 'Please enable location access',
                message:
                    'We need to verify your location. Please enable location access.',
            })
            setChecking(false)
            return
        }

        const { data } = await client.query({
            query: GET_ME_QUERY,
        })

        if (parseFloat(data.me.walletBalance) < entryAmount) {
            setInsufficentFundsModalVisible(true)
            setChecking(false)
            return
        }

        // We made it! User is all good to go
        // Show confirmation modal
        setChecking(false)
        setConfirmationModalVisible(true)
    }

    const submitPicks = async () => {
        setProcessing(true)

        const response = await client.mutate({
            mutation: CREATE_SLIP_MUTATION,
            variables: {
                picks: picks.map((e) => {
                    return {
                        id: e.id,
                        under: e.under,
                    }
                }),
                entryAmount: entryAmount,
            },
        })

        // Redirect
        if (response.data.createSlip.success) {
            history.push('/active?success')
        }
    }

    return (
        <div id="ul-dashboard">
            <Helmet>
                <title>Lobby</title>
            </Helmet>
            <Modal
                onClose={() => setErrorModalVisible({ open: false })}
                open={errorModalVisible.open}
                size="small"
            >
                <Header>
                    <Icon name="exclamation circle" />
                    {errorModalVisible.header}
                </Header>
                <Modal.Content>
                    <p>{errorModalVisible.message}</p>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => setErrorModalVisible({ open: false })}
                    >
                        OK
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal
                onClose={() => setInsufficentFundsModalVisible(false)}
                open={insufficientFundsModalVisible}
                size="small"
            >
                <Header>
                    <Icon name="exclamation circle" />
                    Insufficient funds
                </Header>
                <Modal.Content>
                    <p>
                        You do not have enough funds in your wallet to make this
                        slip. Please click 'Deposit' below to fix this.
                    </p>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => setInsufficentFundsModalVisible(false)}
                    >
                        Close
                    </Button>
                    <Button
                        /* inline because this gets mounted outside of this div. TODO - use mountNode prop */
                        style={{ backgroundColor: '#ff0006', color: 'white' }}
                        onClick={() => history.push('/settings/deposit')}
                    >
                        Deposit
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal
                onClose={() => setConfirmationModalVisible(false)}
                open={confirmationModalVisible}
                size="small"
            >
                <Header>
                    <Icon name="exclamation circle" />
                    Confirmation
                </Header>
                <Modal.Content>
                    <p>Once you confirmed, your selections are locked.</p>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        color="red"
                        onClick={() => setConfirmationModalVisible(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="green"
                        onClick={submitPicks}
                        loading={processing}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
            <Header as="h2" textAlign="center">
                Over/Under
                <Header.Subheader>
                    Pick 2, 3, 4, or 5 players from at least two teams. <br />
                    Predict if they will go OVER or UNDER their projected stat
                    line.
                </Header.Subheader>
            </Header>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={12}>
                        <LobbyHeader />
                        <PlayerList
                            picks={picks}
                            addOrRemovePick={addOrRemovePick}
                        />
                    </Grid.Column>
                    <Grid.Column width={4}>
                        <Header as="h1">Review picks</Header>
                        <Progress percent={percent} color="green">
                            {multiplier}
                        </Progress>
                        <Form loading={checking}>
                            <Form.Group widths="equal">
                                <Form.Input
                                    fluid
                                    icon="dollar"
                                    iconPosition="left"
                                    label="Entry amount"
                                    placeholder="0"
                                    type="text"
                                    error={payoutErrorVisible}
                                    size="huge"
                                    value={entryAmount}
                                    onChange={(e) => {
                                        setPayoutErrorVisible(false)
                                        const re = /^[0-9\b]+$/
                                        if (
                                            re.test(e.target.value) ||
                                            e.target.value === ''
                                        ) {
                                            setEntryAmount(e.target.value)
                                            setPayout(
                                                (e.target.value *
                                                    getMultiplier(
                                                        picks.length
                                                    ): '')
                                            )
                                        }
                                    }}
                                />
                                <Form.Input
                                    fluid
                                    icon="dollar"
                                    iconPosition="left"
                                    className="payout-box"
                                    label="Payout"
                                    placeholder="0"
                                    value={payout}
                                    size="huge"
                                />
                            </Form.Group>
                            <Form.Button
                                disabled={picks.length < 2}
                                onClick={checkPicks}
                                fluid
                                color="green"
                                size="huge"
                            >
                                Submit
                            </Form.Button>
                        </Form>
                        <Header as="h2">Slip</Header>
                        {picks.length === 0 && (
                            <p>
                                Select a featured player from at least two
                                teams.
                            </p>
                        )}
                        {picks.map((pick) => (
                            <Card fluid className="slip-card">
                                <Card.Content>
                                    <Grid columns="two" divided>
                                        <Grid.Row>
                                            <Grid.Column>
                                                <Image
                                                    src={
                                                        pick.line.player
                                                            .headshotUrl
                                                    }
                                                />
                                            </Grid.Column>
                                            <Grid.Column>
                                                <Header as="h4">
                                                    {pick.line.player.name}
                                                </Header>
                                                <List>
                                                    <List.Item className="lol">
                                                        <List.Icon name="hashtag" />
                                                        <List.Content>
                                                            Points:{' '}
                                                            {parseFloat(
                                                                pick.nbaPointsLine
                                                            ).toFixed(1)}
                                                        </List.Content>
                                                    </List.Item>
                                                    <List.Item>
                                                        <List.Icon name="calendar outline" />
                                                        <List.Content>
                                                            {
                                                                pick.line.game
                                                                    .awayTeam
                                                                    .abbreviation
                                                            }{' '}
                                                            @{' '}
                                                            {
                                                                pick.line.game
                                                                    .homeTeam
                                                                    .abbreviation
                                                            }{' '}
                                                            -{' '}
                                                            {moment
                                                                .tz(
                                                                    pick.line
                                                                        .game
                                                                        .datetime,
                                                                    moment.tz.guess()
                                                                )
                                                                .format(
                                                                    'h:mma z'
                                                                )}
                                                        </List.Content>
                                                    </List.Item>
                                                    <List.Item>
                                                        <List.Icon name="basketball ball" />
                                                        <List.Content>
                                                            {pick.under
                                                                ? 'Under'
                                                                : 'Over'}
                                                        </List.Content>
                                                    </List.Item>
                                                </List>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                </Card.Content>
                                <Card.Content extra>
                                    <Button
                                        fluid
                                        color="red"
                                        basic
                                        size="tiny"
                                        onClick={() =>
                                            addOrRemovePick(pick, pick.under)
                                        }
                                    >
                                        Remove
                                    </Button>
                                </Card.Content>
                            </Card>
                        ))}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    )
}

export default Lobby
