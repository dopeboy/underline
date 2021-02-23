import React, { useState } from 'react'
import {
    Message,
    Card,
    Header,
    Grid,
    Image,
    Modal,
    Icon,
    Label,
    List,
    Form,
    Button,
    Container,
    Segment,
} from 'semantic-ui-react'
import logo from 'images/logo.png'
import { Helmet } from 'react-helmet'
import { gql, useQuery } from '@apollo/client'
import { parseQuery, saveJWT } from 'utils'
import { Link, useLocation, useHistory } from 'react-router-dom'
import moment from 'moment-timezone'
import './Active.scss'

const GET_INACTIVE_SLIPS_QUERY = gql`
    query {
        completeSlips {
            id
            datetimeCreated
            entryAmount
            payoutAmount
            won
            picks {
                id
                underNbaPoints
                won
                subline {
                    nbaPointsLine
                    line {
                        nbaPointsActual
                        id
                        player {
                            name
                            headshotUrl
                        }
                        game {
                            homeTeam {
                                abbreviation
                                id
                            }
                            awayTeam {
                                abbreviation
                                id
                            }
                            datetime
                        }
                    }
                }
            }
        }
    }
`

const Completed = () => {
    const history = useHistory()
    const { data } = useQuery(GET_INACTIVE_SLIPS_QUERY)
    const [successModalVisible, setSuccessModalVisible] = useState(
        parseQuery(useLocation().search).get('success') !== null
    )

    return (
        <Form loading={!data} id="ul-active">
            <Helmet>
                <title>Complete slips</title>
            </Helmet>
            <Modal
                onClose={() => setSuccessModalVisible(false)}
                open={successModalVisible}
                size="small"
            >
                <Header>
                    <Icon name="exclamation circle" />
                    Success
                </Header>
                <Modal.Content>
                    <p>Your slip has been submitted.</p>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => setSuccessModalVisible(false)}>
                        OK
                    </Button>
                </Modal.Actions>
            </Modal>
            <Header as="h2">Completed slips</Header>
            {data && data.completeSlips.length === 0 && (
                <div>
                    No completed slips yet. Go to the{' '}
                    <Link to="/lobby">Lobby</Link> to make some picks.
                </div>
            )}

            {data &&
                data.completeSlips.map((slip) => {
                    return (
                        <Segment className="slip" raised>
                            <Header as="h3" className="title">
                                {' '}
                                {`${slip.picks.length} Picks for $${slip.payoutAmount}`}
                            </Header>
                            {slip.picks.map((pick, i) => (
                                <Grid className="pick-table">
                                    <Grid.Row>
                                        <Grid.Column width={3}>
                                            <Image
                                                size="tiny"
                                                src={
                                                    pick.subline.line.player
                                                        .headshotUrl
                                                }
                                            />
                                        </Grid.Column>
                                        <Grid.Column width={5}>
                                            <Header
                                                as="h4"
                                                className="player-name"
                                            >
                                                {pick.subline.line.player.name}
                                            </Header>
                                            <span className="over-under">
                                                {`${
                                                    pick.underNbaPoints
                                                        ? 'Under'
                                                        : 'Over'
                                                }`}
                                            </span>{' '}
                                            {`${parseFloat(
                                                pick.subline.nbaPointsLine
                                            ).toFixed(1)} points`}
                                        </Grid.Column>
                                        <Grid.Column width={5}>
                                            {
                                                pick.subline.line.game.awayTeam
                                                    .abbreviation
                                            }{' '}
                                            @{' '}
                                            {
                                                pick.subline.line.game.homeTeam
                                                    .abbreviation
                                            }{' '}
                                            -{' '}
                                            {moment(
                                                pick.subline.line.game.datetime
                                            )
                                                .tz('America/Los_Angeles')
                                                .format('h:mma z')}
                                            {pick.subline.line
                                                .nbaPointsActual && (
                                                <div>
                                                    {`${parseInt(
                                                        pick.subline.line
                                                            .nbaPointsActual
                                                    )} points scored`}
                                                </div>
                                            )}
                                        </Grid.Column>
                                        <Grid.Column width={3}>
                                            {pick.won === null && (
                                                <Label color="gray">
                                                    In progress
                                                </Label>
                                            )}
                                            {pick.won === true && (
                                                <Label color="green">Won</Label>
                                            )}
                                            {pick.won === false && (
                                                <Label color="red">Lost</Label>
                                            )}
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>
                            ))}
                            <div className="details">
                                <div
                                    className={`entry-amount ${
                                        slip.won ? 'won' : ''
                                    }`}
                                >
                                    {!slip.won && `-$${slip.entryAmount}`}
                                    {slip.won && `+$${slip.payoutAmount}`}
                                </div>
                                <div className="created">
                                    created{' '}
                                    {moment(slip.datetimeCreated).fromNow()}
                                </div>
                            </div>
                        </Segment>
                    )
                })}
        </Form>
    )
}

export default Completed