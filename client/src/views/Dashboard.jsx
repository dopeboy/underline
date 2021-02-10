import React, { Component } from 'react'
import {
    Divider,
    Form,
    Progress,
    Segment,
    Grid,
    Icon,
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
import { gql, useQuery } from '@apollo/client'
import moment from 'moment-timezone'
import './Dashboard.css'
import { Helmet } from 'react-helmet'

const GET_TODAYS_LINES_QUERY = gql`
    query {
        todaysLines {
            id
            pointsLine
            player {
                id
                name
                headshotUrl
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
`

const PlayerList = () => {
    const { data } = useQuery(GET_TODAYS_LINES_QUERY)
    return (
        <Card.Group>
            {data && (
                <>
                    {data.todaysLines.map((line) => (
                        <Card>
                            <Image
                                size="small"
                                src={line.player.headshotUrl}
                                wrapped
                                ui={false}
                            />
                            <Card.Content>
                                <Card.Header>{line.player.name}</Card.Header>
                                <Card.Meta>
                                    <span className="date">
                                        Points: {line.pointsLine}
                                    </span>
                                </Card.Meta>
                                <Card.Description>
                                    {line.game.awayTeam.abbreviation} @{' '}
                                    {line.game.homeTeam.abbreviation} -{' '}
                                    {moment(line.game.datetime)
                                        .tz('America/Los_Angeles')
                                        .format('h:mma z')}
                                </Card.Description>
                            </Card.Content>
                            <Card.Content extra>
                                <Button.Group size="large" fluid>
                                    <Button>Under</Button>
                                    <Button.Or />
                                    <Button>Over</Button>
                                </Button.Group>
                            </Card.Content>
                        </Card>
                    ))}
                </>
            )}
        </Card.Group>
    )
}

export default class Dashboard extends Component {
    state = { activeItem: 'lobby', picks: [], percent: 0 }
    under = () => {
        this.setState({
            picks: [...this.state.picks, true],
            percent: this.state.percent + 20,
        })
    }

    over = () => {
        this.setState({
            picks: [...this.state.picks, false],
            percent: this.state.percent + 20,
        })
    }

    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    render() {
        const { activeItem } = this.state

        return (
            <>
                <Helmet>
                    <title>Dashboard</title>
                </Helmet>
                <Menu secondary>
                    <Menu.Item
                        name="Lobby"
                        active={activeItem === 'lobby'}
                        onClick={this.handleItemClick}
                    />
                    <Menu.Item
                        name="active"
                        active={activeItem === 'active'}
                        onClick={this.handleItemClick}
                    />
                    <Menu.Item
                        name="completed"
                        active={activeItem === 'completed'}
                        onClick={this.handleItemClick}
                    />
                </Menu>

                <Grid>
                    <Grid.Row>
                        <Grid.Column width={12}>
                            <Header as="h2">Featured players</Header>
                            <PlayerList />
                        </Grid.Column>
                        <Grid.Column width={4}>
                            <Header as="h2">Review picks</Header>
                            <Progress
                                percent={this.state.percent}
                                color="green"
                            >
                                {this.state.percent === 0
                                    ? '1x'
                                    : this.state.percent < 40
                                    ? '3x'
                                    : '6x'}
                            </Progress>
                            <Form>
                                <Form.Group widths="equal">
                                    <Form.Input
                                        fluid
                                        icon="dollar"
                                        iconPosition="left"
                                        label="Entry amount"
                                        placeholder="Entry amount"
                                    />
                                    <Form.Input
                                        fluid
                                        icon="dollar"
                                        iconPosition="left"
                                        label="Payout"
                                        placeholder="Payout"
                                    />
                                </Form.Group>
                                <Form.Button fluid color="green">
                                    Submit
                                </Form.Button>
                            </Form>
                            {this.state.picks.length > 0 && <Divider />}
                            {this.state.picks.map((item) => (
                                <Card fluid>
                                    <Card.Content>
                                        <Image floated="left" size="mini" />
                                        <Card.Header>
                                            Patrick Mahones
                                        </Card.Header>
                                        <Card.Meta>
                                            25.85 Fantasy Points
                                        </Card.Meta>
                                        <Card.Description>
                                            KC @ TB - 3:30 PM
                                        </Card.Description>
                                    </Card.Content>
                                    <Card.Content extra>
                                        <Button
                                            basic
                                            color={item ? 'red' : 'green'}
                                            fluid
                                        >
                                            {item ? 'Under' : 'Over'}
                                        </Button>
                                    </Card.Content>
                                </Card>
                            ))}
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </>
        )
    }
}
