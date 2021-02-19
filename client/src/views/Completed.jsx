import React, { useState } from 'react'
import {
    Message,
    Card,
    Header,
    Grid,
    Image,
    List,
    Form,
    Button,
    Container,
} from 'semantic-ui-react'
import logo from 'images/logo.png'
import { Helmet } from 'react-helmet'
import { gql, useQuery } from '@apollo/client'
import { saveJWT } from 'utils'
import { useHistory } from 'react-router-dom'
import moment from 'moment-timezone'
import './Active.scss'

const GET_INACTIVE_SLIPS_QUERY = gql`
    query {
        inactiveSlips {
            id
            datetimeCreated
            picks {
                id
                underNbaPoints
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

const Active = () => {
    const history = useHistory()
    const { data } = useQuery(GET_INACTIVE_SLIPS_QUERY)

    return (
        <Form loading={!data} id="ul-active">
            <Helmet>
                <title>Completed slips</title>
            </Helmet>
            {data &&
                data.inactiveSlips.map((slip) => {
                    return (
                        <div className="slip">
                            <Header as="h3">
                                Slip&nbsp;
                                {moment(slip.datetimeCreated)
                                    .tz('America/Los_Angeles')
                                    .format('M/D/YY')}
                            </Header>
                            <Card.Group>
                                {slip.picks.map((pick) => {
                                    return (
                                        <Card className="slip-card">
                                            <Card.Content>
                                                <Grid columns="two" divided>
                                                    <Grid.Row>
                                                        <Grid.Column>
                                                            <Image
                                                                src={
                                                                    pick.subline
                                                                        .line
                                                                        .player
                                                                        .headshotUrl
                                                                }
                                                            />
                                                        </Grid.Column>
                                                        <Grid.Column>
                                                            <Header as="h4">
                                                                {
                                                                    pick.subline
                                                                        .line
                                                                        .player
                                                                        .name
                                                                }
                                                            </Header>
                                                            <List>
                                                                <List.Item className="lol">
                                                                    <List.Icon name="hashtag" />
                                                                    <List.Content>
                                                                        Points:{' '}
                                                                        {parseFloat(
                                                                            pick
                                                                                .subline
                                                                                .nbaPointsLine
                                                                        ).toFixed(
                                                                            1
                                                                        )}
                                                                    </List.Content>
                                                                </List.Item>
                                                                <List.Item className="lol">
                                                                    <List.Icon name="hashtag" />
                                                                    <List.Content>
                                                                        Actual
                                                                        points:{' '}
                                                                        {parseFloat(
                                                                            pick
                                                                                .subline
                                                                                .line
                                                                                .nbaPointsActual
                                                                        ).toFixed(
                                                                            1
                                                                        )}
                                                                    </List.Content>
                                                                </List.Item>
                                                                <List.Item>
                                                                    <List.Icon name="calendar outline" />
                                                                    <List.Content>
                                                                        {
                                                                            pick
                                                                                .subline
                                                                                .line
                                                                                .game
                                                                                .awayTeam
                                                                                .abbreviation
                                                                        }{' '}
                                                                        @{' '}
                                                                        {
                                                                            pick
                                                                                .subline
                                                                                .line
                                                                                .game
                                                                                .homeTeam
                                                                                .abbreviation
                                                                        }{' '}
                                                                        -{' '}
                                                                        {moment(
                                                                            pick
                                                                                .subline
                                                                                .line
                                                                                .game
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
                                                                        {pick.underNbaPoints
                                                                            ? 'Under'
                                                                            : 'Over'}
                                                                    </List.Content>
                                                                </List.Item>
                                                            </List>
                                                        </Grid.Column>
                                                    </Grid.Row>
                                                </Grid>
                                            </Card.Content>
                                        </Card>
                                    )
                                })}
                            </Card.Group>
                        </div>
                    )
                })}
        </Form>
    )
}

export default Active
