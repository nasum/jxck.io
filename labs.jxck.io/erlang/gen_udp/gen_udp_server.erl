#!/usr/bin/env escript
-module(gen_udp_server).
-behaviour(gen_server).
-mode(compile).
-compile(export_all).
-include("../logger.hrl").

%%====================================================================
%% API functions
%%====================================================================
%% 複数起動できるように名前はつけない
start_link(Socket) ->
    gen_server:start_link(?MODULE, Socket, []).


%%====================================================================
%% Behaviour callbacks
%%====================================================================
init(Socket) ->
    ?Log(Socket),
    State = #{socket => Socket},
    {ok, State}.

handle_call(Msg, From, State) ->
    ?Log(Msg, From, State),
    {reply, Msg, State}.

handle_cast(Msg, State) ->
    ?Log(Msg, State),
    {noreply, State}.

handle_info({udp, Socket, IP, Port, Packet}, #{socket := Socket}=State) ->
    ?Log(Packet, State),
    ok = inet:setopts(Socket, [{active, once}, binary]),
    {noreply, State}.

code_change(OldVsn, State, Extra) ->
    ?Log(OldVsn, Extra),
    {ok, State}.

terminate(Reason, State) ->
    ?Log(Reason, State),
    ok.


%%====================================================================
%% Internal functions
%%====================================================================
main([]) ->
    % gen_tcp:controlling_process してからじゃないと取りこぼすので
    % ここでは {active, false} にしておく
    {ok, Socket} = ?Log(gen_udp:open(3000, [{reuseaddr, true}, {active, false}])),
    {ok, PID} = ?Log(start_link(Socket)),
    ok = gen_tcp:controlling_process(Socket, PID),
    ok = inet:setopts(Socket, [{active, once}, binary]),
    receive
        stop -> gen_tcp:close(Socket)
    end.
