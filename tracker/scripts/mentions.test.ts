// Run with: npx tsx scripts/mentions.test.ts
import assert from "node:assert/strict";
import { linkMentions, mentionedUsernames } from "../src/lib/mentions";

const users = ["rishav", "torsha", "a-b"];
assert.deepEqual(mentionedUsernames("hi @rishav and @Torsha, ok @rishav.", users), ["rishav", "torsha"]);
assert.deepEqual(mentionedUsernames("@a-b", users), ["a-b"]);
assert.deepEqual(mentionedUsernames("mail me@rishav.com or @nobody", users), []);
assert.deepEqual(mentionedUsernames("@rishavx @rishav-x", users), []);
assert.equal(linkMentions("hi @rishav, @nobody", users), "hi [@rishav](/users), @nobody");
console.log("mentions ok");
