import styled from "styled-components";
import { colors } from "variables";
import { WithAlert } from "components/button";

import { useContext } from "react";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
  deleteObject,
} from "firebase/storage";
import { Media, useDeleteMediaMutation } from "lib/graphql";
import { formatByte } from "lib/util";
import { StoreContext } from "providers";

type Props = {
  image: Media;
  onDelete?: () => void;
};

export const Preview = ({ image, onDelete }: Props) => {
  const store = useContext(StoreContext);
  const storage = getStorage();

  const deleteMedia = useDeleteMediaMutation(store.auth.client.graphQLClient);

  const remove = () => {
    store.busy.setIsBusy(true);

    const deleteRef = ref(storage, `medias/${image.name}`);
    deleteMedia.mutate(
      { id: image.id },
      {
        onSuccess: () => {
          deleteObject(deleteRef)
            .then(() => {
              store.busy.setIsBusy(false);

              if (onDelete) {
                onDelete();
              }
            })
            .catch((e) => {
              store.busy.setIsBusy(false);
              console.error(e);
            });
        },
      }
    );
  };

  const handleClick = () => {
    store.popup.setContent(
      <WithAlert
        message="本当に削除しますか？"
        onSubmit={() => {
          store.popup.setContent(null);
          remove();
        }}
        onDismiss={() => {
          store.popup.setContent(null);
        }}
      />
    );
  };

  return (
    <Component>
      <div className="preview">
        <img src={image.url} alt={image.name} />
      </div>

      <div className="footer">
        <div className="meta">
          <p className="name">Name: {image.name}</p>
          <p className="size">Size: {formatByte(image.size)}</p>
        </div>

        <div className="actions">
          <button className="remove" type="button" onClick={handleClick}>
            削除
          </button>
        </div>
      </div>
    </Component>
  );
};

const Component = styled.div`
  position: relative;
  width: 100%;

  img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .meta {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    p {
      margin: 0;
      line-height: 1.75;

      &:not(:first-child) {
        margin-left: 1rem;
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;

    button {
      margin: 0;
      line-height: 1.75;

      &:not(:first-child) {
        margin-left: 1rem;
      }
    }
  }

  .remove {
    color: ${colors.red};
    text-decoration: underline;
  }
`;
