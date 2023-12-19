import React from 'react';
import moment from 'moment';

const MessageModel = ({ nickname, message, timestamp }) => {
  const isMessagePresent = message && message.trim().length > 0;

  return (
    <div>
      {isMessagePresent && (
        <p>
          <strong>{nickname}:</strong> {message} ({moment(timestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZZ')})
        </p>
      )}
    </div>
  );
};

export default MessageModel;
