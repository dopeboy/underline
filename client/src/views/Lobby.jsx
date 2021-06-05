import React, { useRef, useState, Component } from 'react'
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
    Popup,
    Modal,
    Card,
    Image,
    Header,
    Input,
    Container,
    Button,
    Dropdown,
    Menu,
    Tab,
} from 'semantic-ui-react'
import logo from '../images/logo.png'
import { gql, useApolloClient, useQuery } from '@apollo/client'
import moment from 'moment-timezone'
import { Helmet } from 'react-helmet'
import './Lobby.scss'
import { useParams, Link, useHistory } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive'
import { getJWT, clearJWT } from 'utils'

const GET_TODAYS_SUBLINES_AND_LINE_CATEGORIES_QUERY = gql`
    query {
        todaysSublines {
            id
            projectedValue
            line {
                id
                category {
                    id
                    category
                }
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
        lineCategories(league: "NBA") {
            id
            category
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
    mutation CreateSlip(
        $picks: [PickType]!
        $entryAmount: Int!
        $creatorCode: String
    ) {
        createSlip(
            picks: $picks
            entryAmount: $entryAmount
            creatorCode: $creatorCode
        ) {
            success
            freeToPlay
        }
    }
`

const CREATE_CREATOR_SLIP_MUTATION = gql`
    mutation CreateCreatorSlip($picks: [PickType]!) {
        createCreatorSlip(picks: $picks) {
            success
        }
    }
`

const GET_ME_QUERY = gql`
    query {
        me {
            firstName
            lastName
            username
            walletBalance
        }
    }
`

const PlayerList = ({ picks, addOrRemovePick, setTabActiveIndex }) => {
    const { data } = useQuery(GET_TODAYS_SUBLINES_AND_LINE_CATEGORIES_QUERY)
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 767px)' })

    const panes =
        data &&
        data.lineCategories.map((lineCategory) => {
            return {
                menuItem: lineCategory.category,
                pane: {
                    key: lineCategory.category,
                    content: (
                        <Card.Group itemsPerRow={!isTabletOrMobile && 4}>
                            {data.todaysSublines
                                .filter(
                                    (subline) =>
                                        subline.line.category.category ===
                                        lineCategory.category
                                )
                                .map((subline) => {
                                    const pick = picks.filter((e) => {
                                        return e.id === subline.id
                                    })[0]

                                    return (
                                        <Card
                                            fluid={isTabletOrMobile}
                                            key={subline.id}
                                        >
                                            <Image
                                                size="tiny"
                                                src={
                                                    subline.line.player
                                                        .headshotUrl
                                                }
                                                wrapped
                                                ui={false}
                                            />
                                            <Card.Content>
                                                <Card.Header>
                                                    {subline.line.player.name}
                                                </Card.Header>
                                                <Card.Meta>
                                                    <span className="date">
                                                        {
                                                            subline.line
                                                                .category
                                                                .category
                                                        }
                                                        :{' '}
                                                        {parseFloat(
                                                            subline.projectedValue
                                                        ).toFixed(1)}
                                                    </span>
                                                </Card.Meta>
                                                <Card.Description>
                                                    {
                                                        subline.line.game
                                                            .awayTeam
                                                            .abbreviation
                                                    }{' '}
                                                    @{' '}
                                                    {
                                                        subline.line.game
                                                            .homeTeam
                                                            .abbreviation
                                                    }{' '}
                                                    -{' '}
                                                    {moment
                                                        .tz(
                                                            subline.line.game
                                                                .datetime,
                                                            moment.tz.guess()
                                                        )
                                                        .format('h:mma z')}
                                                </Card.Description>
                                            </Card.Content>
                                            <Card.Content extra>
                                                <Button.Group
                                                    size="large"
                                                    fluid
                                                >
                                                    <Button
                                                        className="over-under-btn"
                                                        color={
                                                            pick && !pick.under
                                                                ? 'black'
                                                                : ''
                                                        }
                                                        content="Over"
                                                        onClick={() =>
                                                            addOrRemovePick(
                                                                subline,
                                                                false
                                                            )
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
                                                            addOrRemovePick(
                                                                subline,
                                                                true
                                                            )
                                                        }
                                                    />
                                                </Button.Group>
                                            </Card.Content>
                                        </Card>
                                    )
                                })}
                        </Card.Group>
                    ),
                },
            }
        })

    return (
        <Form loading={!data}>
            {data && data.todaysSublines.length === 0 ? (
                <p>There are no more games today.</p>
            ) : (
                <Tab
                    panes={panes}
                    onTabChange={(e, { activeIndex }) =>
                        setTabActiveIndex(activeIndex)
                    }
                    renderActiveOnly={false}
                />
            )}
        </Form>
    )
}

const PicksList = ({ picks, addOrRemovePick, isSelf }) => {
    return (
        <>
            <Header as="h2">Slip</Header>
            {picks.length === 0 && (
                <p>Select a featured player from at least two teams.</p>
            )}
            {picks.map((pick) => (
                <Card fluid className="slip-card">
                    <Card.Content>
                        <Grid columns="two" divided>
                            <Grid.Row>
                                <Grid.Column>
                                    <Image src={pick.line.player.headshotUrl} />
                                </Grid.Column>
                                <Grid.Column>
                                    <Header as="h4">
                                        {pick.line.player.name}
                                    </Header>
                                    <List>
                                        <List.Item>
                                            <List.Icon name="hashtag" />
                                            <List.Content>
                                                {pick.line.category.category}:{' '}
                                                {parseFloat(
                                                    pick.projectedValue
                                                ).toFixed(1)}
                                            </List.Content>
                                        </List.Item>
                                        <List.Item>
                                            <List.Icon name="calendar outline" />
                                            <List.Content>
                                                {
                                                    pick.line.game.awayTeam
                                                        .abbreviation
                                                }{' '}
                                                @{' '}
                                                {
                                                    pick.line.game.homeTeam
                                                        .abbreviation
                                                }{' '}
                                                -{' '}
                                                {moment
                                                    .tz(
                                                        pick.line.game.datetime,
                                                        moment.tz.guess()
                                                    )
                                                    .format('h:mma z')}
                                            </List.Content>
                                        </List.Item>
                                        <List.Item>
                                            <List.Icon name="basketball ball" />
                                            <List.Content>
                                                {pick.under ? 'Under' : 'Over'}
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
                            onClick={() => addOrRemovePick(pick, pick.under)}
                        >
                            Remove
                        </Button>
                    </Card.Content>
                </Card>
            ))}
        </>
    )
}

const LobbyHeader = () => {
    const { data } = useQuery(GET_CURRENT_DATE_QUERY)
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 767px)' })

    return (
        <Header as={isTabletOrMobile ? 'h3' : 'h2'}>
            Featured Players:{' '}
            {data && moment(data.currentDate).format('MMMM Do YYYY')}
        </Header>
    )
}

const Lobby = ({ updateMainComponent }) => {
    const [tab, setTab] = useState('lobby')
    const [picks, setPicks] = useState([])
    const [percent, setPercent] = useState(0)
    const [multiplier, setMultiplier] = useState('1x')
    const [payout, setPayout] = useState('')
    const [entryAmount, setEntryAmount] = useState('')
    const [checking, setChecking] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [
        scrollToBottomButtonVisible,
        setScrollToBottomButtonVisible,
    ] = useState(true)
    const [errorModalVisible, setErrorModalVisible] = useState({
        open: false,
        header: '',
        message: '',
    })
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(
        false
    )
    const [
        creatorSlipCreatedModalVisible,
        setCreatorSlipCreatedModalVisible,
    ] = useState(false)
    const { code, username } = useParams()
    const [creatorCode, setCreatorCode] = useState(code ? code : '')
    const [tabActiveIndex, setTabActiveIndex] = useState()
    const [
        insufficientFundsModalVisible,
        setInsufficentFundsModalVisible,
    ] = useState(false)
    const [payoutErrorVisible, setPayoutErrorVisible] = useState(false)
    const client = useApolloClient()
    const history = useHistory()
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 767px)' })

    const { data } = useQuery(GET_ME_QUERY)
    const isSelf = data && data.me && data.me.username === username

    const addOrRemovePick = (subline, under) => {
        const pickIndex = picks.findIndex((e) => e.id === subline.id)
        let newPicks = []

        // If the pick already exists, remove it or update it
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
    // (2) Check if entry amount is <= $50
    // (3) Check that there are atleast two teams involved
    // (4) Check the location of the user
    // (5) Check if user has linked a payment method
    // (6) Check if user has sufficients funds in their wallet
    const checkPicks = async () => {
        if (!getJWT()) {
            history.push(`/signup${code ? '?code=' + code : ''}`)
            return
        }

        setChecking(true)
        let lat,
            lng = null

        // (1)
        if (!payout) {
            setPayoutErrorVisible(true)
            setChecking(false)
            return
        }

        if (entryAmount > 50) {
            setPayoutErrorVisible(true)
            setErrorModalVisible({
                open: true,
                header: 'Max $50 entry',
                message: 'We only allow a maximum of $50 for entry',
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

        if (!getJWT()) {
            history.push(`/signup${username ? '?username=' + username : ''}`)
            return
        }

        setChecking(true)

        // (1)
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

        const response = await client.mutate({
            mutation: CREATE_SLIP_MUTATION,
            variables: {
                picks: picks.map((e) => {
                    return {
                        id: e.id,
                        under: e.under,
                    }
                }),
                creatorCode: creatorCode,
                entryAmount: entryAmount,
            },
        })

        // Redirect
        if (response.data.createSlip.success) {
            updateMainComponent()
            history.push(
                `/active?success${
                    response.data.createSlip.freeToPlay ? '&freetoplay' : ''
                }`
            )
        }
    }

    const createCreatorSlip = async () => {
        setProcessing(true)

        const response = await client.mutate({
            mutation: CREATE_CREATOR_SLIP_MUTATION,
            variables: {
                picks: picks.map((e) => {
                    return {
                        id: e.id,
                        under: e.under,
                    }
                }),
            },
        })

        if (response.data.createCreatorSlip.success) {
            setCreatorSlipCreatedModalVisible(true)
        }
    }

    const handleScroll = () => {
        const bottom =
            Math.ceil(window.innerHeight + window.scrollY) + 50 >=
            document.documentElement.scrollHeight

        setScrollToBottomButtonVisible(!bottom)
    }

    React.useEffect(() => {
        window.addEventListener('scroll', handleScroll, {
            passive: true,
        })

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const slipButtonRef = useRef(null)
    const scrollToBottom = () => {
        slipButtonRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div id="ul-dashboard">
            {isTabletOrMobile && scrollToBottomButtonVisible && (
                <Button
                    color="black"
                    className="scroll-bottom-btn"
                    onClick={scrollToBottom}
                >
                    Review slip
                </Button>
            )}
            <Helmet>
                <title>Lobby</title>
            </Helmet>
            <Modal
                closeOnEscape={false}
                closeOnDimmerClick={false}
                open={creatorSlipCreatedModalVisible}
                size="small"
            >
                <Header>
                    <Icon name="exclamation circle" />
                    You created your own slip!
                </Header>
                <Modal.Content>
                    <p>
                        Congratulations, now share it with the world and earn a
                        share of their profits.
                    </p>
                    <p>
                        <a
                            href={`https://www.underlinefantasy.com/${username}`}
                        >
                            {`https://www.underlinefantasy.com/${username}`}
                        </a>
                    </p>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        size="large"
                        color="green"
                        onClick={() => (window.location.href = '/')}
                    >
                        OK
                    </Button>
                </Modal.Actions>
            </Modal>
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
                    <p>Once confirmed, your selections are locked.</p>
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
            <Header
                as={isTabletOrMobile ? 'h3' : 'h2'}
                textAlign="center"
                className="over-under-header"
            >
                Over/Under
                <Header.Subheader>
                    Pick 2, 3, 4, or 5 players from at least two teams. <br />
                    Predict if they will go OVER or UNDER their projected stat
                    line.
                    <br />
                    {tabActiveIndex == 1 && (
                        <Link to="/settings/fantasypoints">
                            What are fantasy points?
                        </Link>
                    )}
                </Header.Subheader>
            </Header>
            <Grid stackable>
                <Grid.Row>
                    <Grid.Column width={12}>
                        <LobbyHeader />
                        <PlayerList
                            picks={picks}
                            addOrRemovePick={addOrRemovePick}
                            setTabActiveIndex={setTabActiveIndex}
                        />
                        {isTabletOrMobile && (
                            <>
                                <PicksList
                                    isSelf={isSelf}
                                    picks={picks}
                                    addOrRemovePick={addOrRemovePick}
                                />
                                {isSelf && (
                                    <Button
                                        disabled={
                                            picks.length < 2 || processing
                                        }
                                        onClick={createCreatorSlip}
                                        fluid
                                        loading={processing}
                                        color="green"
                                        size="huge"
                                    >
                                        Submit
                                    </Button>
                                )}
                            </>
                        )}
                    </Grid.Column>
                    <Grid.Column width={4}>
                        {!isSelf && (
                            <>
                                <Header as="h2">Review picks</Header>
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
                                                    setEntryAmount(
                                                        e.target.value
                                                    )
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
                                    <Form.Field
                                        fluid
                                        placeholder="Creator code (optional)"
                                        onChange={(e) =>
                                            setCreatorCode(e.target.value)
                                        }
                                    >
                                        <label>
                                            Creator code
                                            <Popup
                                                trigger={
                                                    <Icon
                                                        className="creator-code"
                                                        circular
                                                        name="question"
                                                    />
                                                }
                                                content="Support your favorite sports content creator. Underline bonuses creators anytime a user wins."
                                                on="click"
                                                position="right center"
                                            />
                                        </label>
                                        <input
                                            className="creator-code-input"
                                            placeholder="Creator code (optional)"
                                            value={creatorCode}
                                        />
                                    </Form.Field>
                                    <Form.Button
                                        disabled={picks.length < 2}
                                        onClick={checkPicks}
                                        fluid
                                        color="green"
                                        size="huge"
                                    >
                                        Submit
                                    </Form.Button>
                                    <div ref={slipButtonRef} />
                                </Form>
                            </>
                        )}
                        {!isTabletOrMobile && (
                            <>
                                <PicksList
                                    picks={picks}
                                    isSelf={isSelf}
                                    addOrRemovePick={addOrRemovePick}
                                />
                                {isSelf && (
                                    <Button
                                        disabled={
                                            picks.length < 2 || processing
                                        }
                                        onClick={createCreatorSlip}
                                        fluid
                                        loading={processing}
                                        color="green"
                                        size="huge"
                                    >
                                        Submit
                                    </Button>
                                )}
                            </>
                        )}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    )
}

export default Lobby
