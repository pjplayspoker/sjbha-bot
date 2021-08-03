import { Instance } from '@sjbha/app';
import { GuildMember } from 'discord.js';
import { Maybe } from 'purify-ts';

/**
 * Fetches members from an array of IDs, 
 * and then provides a lookup table for their nicknames
 */
export class MemberList {
  private memberById = new Map<string, GuildMember> ();

  private constructor (members: GuildMember[]) {
    members.forEach (member => {
      this.memberById.set (member.id, member);
    });
  }

  get = (discordId: string) : Maybe<GuildMember> => 
    Maybe.fromNullable (this.memberById.get (discordId));

  nickname = (discordId: string, orDefault = 'unknown') : string =>
    Maybe
      .fromNullable (this.memberById.get (discordId))
      .chainNullable (m => m.nickname)
      .orDefault (orDefault);

  static fetch = async (discordIds: string[]) : Promise<MemberList> => {
    const members = await Instance.fetchMembers (discordIds).catch (e => {
      console.error ('Failed to fetch member list');
      console.error (e);

      return [] as GuildMember[];
    });

    return new MemberList (members);
  }
}