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
            invalidated
            freeToPlay
            picks {
                id
                under
                won
                subline {
                    projectedValue
                    line {
                        actualValue
                        id
                        category {
                            id
                            category
                        }
                        invalidated
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
                            <Label
                                color={slip.freeToPlay ? '' : 'black'}
                                attached="top right"
                            >
                                {slip.freeToPlay
                                    ? 'Free to Play'
                                    : 'Paid Entry'}
                            </Label>
                            {slip.picks.map((pick, i) => (
                                <Grid stackable className="pick-table">
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
                                                    pick.under
                                                        ? 'Under'
                                                        : 'Over'
                                                }`}
                                            </span>{' '}
                                            {`${parseFloat(
                                                pick.subline.projectedValue
                                            ).toFixed(
                                                1
                                            )} ${pick.subline.line.category.category.toLowerCase()}`}
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
                                            {pick.subline.line.invalidated && (
                                                <div>DNP</div>
                                            )}
                                            {!pick.subline.line.invalidated &&
                                                pick.subline.line
                                                    .actualValue && (
                                                    <div>
                                                        {`${parseInt(
                                                            pick.subline.line
                                                                .actualValue
                                                        )} ${pick.subline.line.category.category.toLowerCase()} scored`}
                                                    </div>
                                                )}
                                        </Grid.Column>
                                        <Grid.Column width={3}>
                                            {pick.subline.line.invalidated && (
                                                <Label color="black">
                                                    Invalidated
                                                </Label>
                                            )}
                                            {!pick.subline.line.invalidated &&
                                                pick.won === null && (
                                                    <Label color="gray">
                                                        In progress
                                                    </Label>
                                                )}
                                            {!pick.subline.line.invalidated &&
                                                pick.won === true && (
                                                    <Label color="green">
                                                        Won
                                                    </Label>
                                                )}
                                            {!pick.subline.line.invalidted &&
                                                pick.won === false && (
                                                    <Label color="red">
                                                        Lost
                                                    </Label>
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
                                    {slip.invalidated && `$0`}
                                    {slip.creatorCode && (
                                        <div>Code: {slip.creatorCode}</div>
                                    )}
                                    {!slip.invalidated &&
                                        !slip.won &&
                                        `-$${slip.entryAmount}`}
                                    {!slip.invalidated &&
                                        slip.won &&
                                        `+$${slip.payoutAmount}`}
                                </div>
                                <div className="created">
                                    {moment(slip.datetimeCreated).format(
                                        'MMMM Do YYYY'
                                    )}
                                </div>
                            </div>
                        </Segment>
                    )
                })}
        </Form>
    )
}

export default Completed
