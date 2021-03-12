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

const GET_ACTIVE_SLIPS_QUERY = gql`
    query {
        activeSlips {
            id
            datetimeCreated
            entryAmount
            payoutAmount
            freeToPlay
            creatorCode
            picks {
                id
                underNbaPoints
                won
                subline {
                    nbaPointsLine
                    line {
                        nbaPointsActual
                        id
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

const Active = () => {
    const history = useHistory()
    const { data } = useQuery(GET_ACTIVE_SLIPS_QUERY)
    const [successModalVisible, setSuccessModalVisible] = useState(
        parseQuery(useLocation().search).get('success') !== null
    )

    return (
        <Form loading={!data} id="ul-active">
            <Helmet>
                <title>Active slips</title>
            </Helmet>
            <Modal
                onClose={() => setSuccessModalVisible(false)}
                open={successModalVisible}
                size="small"
            >
                <Header>
                    <Icon name="check circle" />
                    Success
                </Header>
                <Modal.Content>
                    <p>Your slip has been submitted.</p>

                    {parseQuery(useLocation().search).get('freetoplay') !==
                        null && (
                        <p>
                            This is a free to play entry. Underline only
                            operates paid entries in certain states due to daily
                            fantasy laws.
                        </p>
                    )}
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => setSuccessModalVisible(false)}>
                        OK
                    </Button>
                </Modal.Actions>
            </Modal>
            <Header as="h2">Active slips</Header>
            {data && data.activeSlips.length === 0 && (
                <div>
                    No slips yet. Go to the <Link to="/lobby">Lobby</Link> to
                    make some picks.
                </div>
            )}

            {data &&
                data.activeSlips.map((slip) => {
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
                                <div className="created">
                                    {moment(slip.datetimeCreated).format(
                                        'MMMM Do YYYY'
                                    )}
                                </div>
                                <div className="entry-amount">
                                    {slip.creatorCode && (
                                        <div>Code: {slip.creatorCode}</div>
                                    )}
                                    ${`${slip.entryAmount} Entry`}
                                </div>
                            </div>
                        </Segment>
                    )
                })}
        </Form>
    )
}

export default Active
