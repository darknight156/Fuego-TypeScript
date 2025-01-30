/**
 * @fuego v1.0.0
 * @author painfuego (www.codes-for.fun)
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */

import {
  Role,
  User,
  Channel,
  Collection,
  Attachment,
  GuildMember,
  CommandInteraction,
} from 'discord.js';
import { Context } from '../../interfaces/context.js';
import { ExtendedClient } from '../../classes/client.js';

export const createContext = async (client: ExtendedClient, interaction: CommandInteraction) => {
  if (
    !interaction.user ||
    !interaction.guild ||
    !interaction.member ||
    !interaction.channel ||
    interaction.channel.isDMBased()
  )
    return;

  const mentions = {
    everyone: false,
    users: new Collection<string, User>(),
    roles: new Collection<string, Role>(),
    channels: new Collection<string, Channel>(),
    members: new Collection<string, GuildMember>(),
  };
  const attachments = new Collection<string, Attachment>();

  for (const data of interaction.options.data) {
    if (data.user) {
      mentions.users.set(data.user.id, data.user);
      if (data.member) {
        const member = data.member as GuildMember;
        mentions.members.set(member.id, member);
      }
    } else if (data.role) {
      const role = data.role as Role;
      mentions.roles.set(role.id, role);
      if (role.name === '@everyone') mentions.everyone = true;
    } else if (data.channel) {
      mentions.channels.set(data.channel.id, data.channel as Channel);
    } else if (data.attachment) {
      attachments.set(data.attachment.id, data.attachment);
    } else if (typeof data.value === 'string') {
      if (data.value.includes('@everyone')) mentions.everyone = true;
    }
  }

  const _mentions: Context['mentions'] = {
    everyone: mentions.everyone,
  };

  if (mentions.roles?.size) _mentions.roles = mentions.roles;
  if (mentions.users?.size) _mentions.users = mentions.users;
  if (mentions.members?.size) _mentions.members = mentions.members;
  if (mentions.channels?.size) _mentions.channels = mentions.channels;

  const _attachments = attachments.size ? attachments : undefined;

  const content = interaction.options.data
    .map((data) => data.attachment?.url || `${data.value}`)
    .join(' ');

  const ctx: Context = {
    client: client,
    id: interaction.id,
    mentions: _mentions,
    interaction: interaction,
    guild: interaction.guild,
    author: interaction.user,
    attachments: _attachments,
    channel: interaction.channel,
    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    member: interaction.member as GuildMember,
    createdTimestamp: interaction.createdTimestamp,
    reply: async (args) => await interaction.editReply(args),
    content: `${client.prefix}${interaction.commandName} ${content}`,
    send: async (args) => await interaction.channel!.send(args),
    react: async (emoji, content) => {
      const reply = await interaction.editReply({
        content: `${interaction.member} used the command : \`${interaction.commandName}\``,
      });
      const reaction = await reply.react(emoji);
      if (content) await reply.reply(content);
      return reaction;
    },
  };

  return ctx;
};

/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
