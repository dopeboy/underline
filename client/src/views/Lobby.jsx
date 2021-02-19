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

const CHECK_APPROVED_LOCATION_QUERY = gql`
    query ApprovedLocation($lat: Float!, $lng: Float!) {
        approvedLocation(lat: $lat, lng: $lng)
    }
`

const CREATE_SLIP_MUTATION = gql`
    mutation CreateSlip($picks: [PickType]!) {
        createSlip(picks: $picks) {
            success
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
                                        {moment(subline.line.game.datetime)
                                            .tz('America/Los_Angeles')
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

const Lobby = () => {
    const [tab, setTab] = useState('lobby')
    const [picks, setPicks] = useState([])
    const [percent, setPercent] = useState(0)
    const [multiplier, setMultiplier] = useState('1x')
    const [payout, setPayout] = useState('')
    const [entryAmount, setEntryAmount] = useState('')
    const [processing, setProcessing] = useState(false)
    const [errorModalVisible, setErrorModalVisible] = useState({
        open: false,
        header: '',
        message: '',
    })
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
    // (2) Check that there are atleast two teams involved
    // (3) Check the location of the user
    // (4) Check if user has linked a payment method
    // (5) Check if user has sufficients funds in their wallet
    const submitPicks = async () => {
        setProcessing(true)
        let lat,
            lng = null

        // (1)
        if (!payout) {
            setPayoutErrorVisible(true)
            setProcessing(false)
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
                message: 'You must select picks that span atleast two teams.',
            })
            setProcessing(false)
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
            setProcessing(false)
            return
        } else {
            /*
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { data } = await client.query({
                    query: CHECK_APPROVED_LOCATION_QUERY,
                    variables: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    },
                })

                if (!data.approvedLocation) {
                    setErrorModalVisible({
                        open: true,
                        header: 'Invalid location',
                        message:
                            'Sorry, you are playing from an invalid location.',
                    })
                    setProcessing(false)
                    return
                }

                lat = position.coords.latitude
                lng = position.coords.longitude
            })
            */

            // We made it! User is all good to go
            const response = await client.mutate({
                mutation: CREATE_SLIP_MUTATION,
                variables: {
                    picks: picks.map((e) => {
                        return {
                            id: e.id,
                            under: e.under,
                        }
                    }),
                },
            })

            console.log(response.data)
            // Redirect
            if (response.data.createSlip.success) {
                history.push('/active')
            }
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
            <Header as="h2" textAlign="center">
                Over/Under
                <Header.Subheader>
                    Select 1 player from atleast two teams
                </Header.Subheader>
            </Header>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={12}>
                        <Header as="h1">Featured players</Header>
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
                        <Form loading={processing}>
                            <Form.Group widths="equal">
                                <Form.Input
                                    fluid
                                    icon="dollar"
                                    iconPosition="left"
                                    label="Entry amount"
                                    placeholder="0"
                                    error={payoutErrorVisible}
                                    size="huge"
                                    onChange={(e) => {
                                        setPayoutErrorVisible(false)
                                        setEntryAmount(e.target.value)
                                        setPayout(
                                            (e.target.value *
                                                getMultiplier(picks.length): '')
                                        )
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
                                onClick={submitPicks}
                                fluid
                                color="green"
                                size="huge"
                            >
                                Submit
                            </Form.Button>
                        </Form>
                        <Header as="h2">Slip</Header>
                        {picks.length === 0 && (
                            <p>Add a player from the left.</p>
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
                                                            {moment(
                                                                pick.line.game
                                                                    .datetime
                                                            )
                                                                .tz(
                                                                    'America/Los_Angeles'
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
