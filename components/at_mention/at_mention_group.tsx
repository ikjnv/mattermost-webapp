// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef, useState} from 'react';
import {Overlay} from 'react-bootstrap';

import {Client4} from 'mattermost-redux/client';
import {UserProfile} from '@mattermost/types/users';
import {Group} from '@mattermost/types/groups';

import ProfilePopover from 'components/profile_popover';
import UserGroupPopover from 'components/user_group_popover';

import {A11yCustomEventTypes, A11yFocusEventDetail} from 'utils/constants';
import {popOverOverlayPosition} from 'utils/position_utils';
import {getViewportSize} from 'utils/utils';

import {MAX_LIST_HEIGHT, getListHeight, VIEWPORT_SCALE_FACTOR} from 'components/user_group_popover/group_member_list/group_member_list';

const HEADER_HEIGHT_ESTIMATE = 130;

type Props = {

    /**
     * The group corresponding to this mention
     */
    group: Group;

    /**
     * Props to be passed through from AtMention to ProfilePopover
     */
    isRHS?: boolean;
    channelId?: string;
    hasMention?: boolean;
}

const AtMentionGroup = (props: Props) => {
    const {
        group,
        isRHS,
        channelId,
        hasMention,
    } = props;

    const ref = useRef<HTMLButtonElement>(null);

    const [show, setShow] = useState(false);
    const [showUser, setShowUser] = useState<UserProfile | undefined>();
    const [target, setTarget] = useState<HTMLButtonElement | undefined>();

    // We need a valid placement here to prevent console errors.
    // It will not be used when the overlay is showing.
    const [placement, setPlacement] = useState('top');

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const targetBounds = ref.current?.getBoundingClientRect();

        if (targetBounds) {
            const approximatePopoverHeight = Math.min(
                (getViewportSize().h * VIEWPORT_SCALE_FACTOR) + HEADER_HEIGHT_ESTIMATE,
                getListHeight(group.member_count) + HEADER_HEIGHT_ESTIMATE,
                MAX_LIST_HEIGHT,
            );
            const placement = popOverOverlayPosition(targetBounds, window.innerHeight, approximatePopoverHeight);
            setTarget(e.target as HTMLButtonElement);
            setShow(!show);
            setShowUser(undefined);
            setPlacement(placement);
        }
    };

    const hide = () => {
        setShow(false);
    };

    const showUserOverlay = (user: UserProfile) => {
        hide();
        setShowUser(user);
    };

    const hideUserOverlay = () => {
        setShowUser(undefined);
    };

    const returnFocus = () => {
        document.dispatchEvent(new CustomEvent<A11yFocusEventDetail>(
            A11yCustomEventTypes.FOCUS, {
                detail: {
                    target: ref.current,
                    keyboardOnly: true,
                },
            },
        ));
    };

    return (
        <>
            <Overlay
                placement={placement}
                show={show}
                target={target}
                rootClose={true}
                onHide={hide}
            >
                <UserGroupPopover
                    group={group}
                    hide={hide}
                    showUserOverlay={showUserOverlay}
                    returnFocus={returnFocus}
                />
            </Overlay>
            <Overlay
                placement={placement}
                show={showUser !== undefined}
                target={target}
                onHide={hideUserOverlay}
                rootClose={true}
            >
                {showUser ? (
                    <ProfilePopover
                        className='user-profile-popover'
                        userId={showUser.id}
                        src={Client4.getProfilePictureUrl(showUser.id, showUser.last_picture_update)}
                        isRHS={isRHS}
                        channelId={channelId}
                        hasMention={hasMention}
                        hide={hideUserOverlay}
                        returnFocus={returnFocus}
                    />
                ) : <span/>
                }
            </Overlay>
            <button
                onClick={handleClick}
                className='style--link group-mention-link'
                ref={ref}
                aria-haspopup='dialog'
            >
                {'@' + group.name}
            </button>
        </>
    );
};

export default React.memo(AtMentionGroup);
