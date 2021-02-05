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
import mahones from '../images/mahones.png'
import clyde from '../images/clyde.png'
import { gql, useQuery } from '@apollo/client'
import './Dashboard.css'

const GET_PLAYERS_QUERY = gql`
    query {
        allPlayers {
            id
            name
            headshotUrl
        }
    }
`

const PlayerList = () => {
    const { data } = useQuery(GET_PLAYERS_QUERY)
    return (
        <Card.Group>
            {data && (
                <>
                    {data.allPlayers.map((player) => (
                        <Card>
                            <Image
                                size="small"
                                src={player.headshotUrl}
                                wrapped
                                ui={false}
                            />
                            <Card.Content>
                                <Card.Header>{player.name}</Card.Header>
                                <Card.Meta>
                                    <span className="date">
                                        25.85 Fantasy Points
                                    </span>
                                </Card.Meta>
                                <Card.Description>
                                    KC @ TB - 3:30 PM
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
            <div>
                <Menu size="huge" className="ule navbar">
                    <Menu.Item onClick={this.handleItemClick}>
                        <img src={logo} className="ball" />
                        <span className="comp-name">Underline</span>
                    </Menu.Item>

                    <Menu.Item onClick={this.handleItemClick} active>
                        Pick'Em
                    </Menu.Item>

                    <Menu.Menu position="right">
                        <Dropdown item text="Zach M.">
                            <Dropdown.Menu>
                                <Dropdown.Item>Logout</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Menu>
                </Menu>
                <div id="ule-container">
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
                                            <Image
                                                floated="left"
                                                size="mini"
                                                src={mahones}
                                            />
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
                </div>
            </div>
        )
    }
}
