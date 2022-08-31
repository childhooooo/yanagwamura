import styled from "styled-components";
import { colors } from "variables";
import { Stacked, PlainText, Columns, Block } from "unflexible-ui-core";
import { Panel } from "components/container";
import { IconButton } from "components/button";
import { List, Preview } from "domains/media";

import { ChangeEvent, useState, useContext, useRef } from "react";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  getMetadata,
  deleteObject,
} from "firebase/storage";
import { Media, useCreateMediaMutation } from "lib/graphql";
import { StoreContext } from "providers";
import { getUniqueString } from "lib/util";

export const MediaList = () => {
  const store = useContext(StoreContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedAt, setUploadedAt] = useState(Date.now());

  const storage = getStorage();
  const storageRef = (name: string) => {
    return ref(storage, `medias/${getUniqueString()}-${name}`);
  };

  const createMedia = useCreateMediaMutation(store.auth.client.graphQLClient);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (
      !event.target.files ||
      (event.target.files && event.target.files.length < 1)
    ) {
      return;
    }

    store.busy.setIsBusy(true);
    const file = event.target.files[0];
    event.target.value = "";
    const uploadRef = storageRef(file.name);

    let result;
    try {
      result = await uploadBytes(uploadRef, file);
    } catch(e) {
      console.error(e);
      return;
    }

    try {
      const url = await getDownloadURL(result.ref);
      const meta = await getMetadata(result.ref);

      await createMedia.mutateAsync({
        url,
        name: meta.name,
        size: meta.size,
        media_type: meta?.contentType || "",
      });

      setUploadedAt(Date.now());
    } catch(e) {
      console.error(e);
      deleteObject(uploadRef);
    }

    store.busy.setIsBusy(false);
  };

  const preview = (image: Media) => {
    store.popup.setContent(
      <Block maxWidth="900px">
        <Preview
          image={image}
          onDelete={() => {
            setUploadedAt(Date.now());
          }}
        />
      </Block>
    );
  };

  return (
    <Stacked wrap>
      <Stacked paddingPos="none">
        <Columns align="center" gap="narrow">
          <Block>
            <PlainText>
              <h1>画像一覧</h1>
            </PlainText>
          </Block>

          <IconButton
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.click();
              }
            }}
            color={colors.theme}
            icon="＋"
          />

          <FileInput type="file" ref={inputRef} onChange={upload} />
        </Columns>
      </Stacked>

      <Stacked paddingPos="top" paddingSize="narrow">
        <Panel>
          <List onSelect={preview} key={uploadedAt} />
        </Panel>
      </Stacked>
    </Stacked>
  );
};

const FileInput = styled.input`
  display: none;
`;
