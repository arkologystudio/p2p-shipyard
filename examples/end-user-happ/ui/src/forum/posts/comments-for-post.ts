import { LitElement, html } from "lit";
import { state, customElement, property } from "lit/decorators.js";
import {
  InstalledCell,
  Record,
  Link,
  AppClient,
  EntryHash,
  ActionHash,
  AgentPubKey,
} from "@holochain/client";
import { consume } from "@lit-labs/context";
import "@material/mwc-circular-progress";
import { Task } from "@lit-labs/task";
import { PostsSignal } from "./types";

import { clientContext } from "../../contexts";
import "./comment-detail";

@customElement("comments-for-post")
export class CommentsForPost extends LitElement {
  @consume({ context: clientContext })
  client!: AppClient;

  @property({
    hasChanged: (newVal: ActionHash, oldVal: ActionHash) =>
      newVal.toString() !== oldVal?.toString(),
  })
  postHash!: ActionHash;

  @state()
  hashes: Array<ActionHash> = [];

  _fetchComments = new Task(
    this,
    ([postHash]) =>
      this.client.callZome({
        cap_secret: null,
        role_name: "forum",
        zome_name: "posts",
        fn_name: "get_comments_for_post",
        payload: postHash,
      }) as Promise<Array<Link>>,
    () => [this.postHash],
  );

  firstUpdated() {
    if (this.postHash === undefined) {
      throw new Error(
        `The postHash property is required for the comments-for-post element`,
      );
    }

    this.client.on("signal", (signal) => {
      if (signal.zome_name !== "posts") return;
      const payload = signal.payload as PostsSignal;
      if (
        !(
          payload.type === "EntryCreated" &&
          payload.app_entry.type === "Comment"
        )
      )
        return;
      this._fetchComments.run();
    });
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html`<span>No comments found for this post.</span>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(
          (hash) =>
            html`<comment-detail
              .commentHash=${hash}
              @comment-deleted=${() => {
                this._fetchComments.run();
                this.hashes = [];
              }}
            ></comment-detail>`,
        )}
      </div>
    `;
  }

  render() {
    return this._fetchComments.render({
      pending: () => html`
        <div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `,
      complete: (links) =>
        this.renderList([...this.hashes, ...links.map((l) => l.target)]),
      error: (e: any) => html`<span>Error fetching comments: ${e}.</span>`,
    });
  }
}
