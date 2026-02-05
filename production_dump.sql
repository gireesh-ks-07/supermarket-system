--
-- PostgreSQL database dump
--

\restrict uYO2SUDWCJxzqdwfRwt0AqKEf0nd8yGiO3ShzDu5G2DXh7q3E2iLBGQYCLRigH9

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(v_common_prefix, v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    name text,
    phone text,
    "flatNumber" text
);


--
-- Name: Expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    title text NOT NULL,
    amount numeric(65,30) NOT NULL,
    category text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note text,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    link text,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    "customerId" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note text,
    type text DEFAULT 'CREDIT_PAYMENT'::text NOT NULL,
    "paymentMode" text DEFAULT 'CASH'::text NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    name text NOT NULL,
    barcode text NOT NULL,
    category text NOT NULL,
    brand text,
    unit text NOT NULL,
    "costPrice" numeric(65,30) NOT NULL,
    "sellingPrice" numeric(65,30) NOT NULL,
    "taxPercent" numeric(65,30) NOT NULL,
    "minStockLevel" integer DEFAULT 10 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductBatch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductBatch" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "batchNumber" text NOT NULL,
    "expiryDate" timestamp(3) without time zone,
    quantity double precision NOT NULL,
    "purchaseId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Purchase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Purchase" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    "supplierId" text NOT NULL,
    "invoiceNumber" text,
    "totalAmount" numeric(65,30) NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PurchaseItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PurchaseItem" (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    "productId" text NOT NULL,
    quantity double precision NOT NULL,
    "costPrice" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30),
    total numeric(65,30) NOT NULL
);


--
-- Name: Sale; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sale" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "cashierId" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "subTotal" numeric(65,30) NOT NULL,
    "taxTotal" numeric(65,30) NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    "totalAmount" numeric(65,30) NOT NULL,
    "paymentMode" text NOT NULL,
    "customerId" text,
    "originalPaymentMode" text
);


--
-- Name: SaleItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SaleItem" (
    id text NOT NULL,
    "saleId" text NOT NULL,
    "productId" text NOT NULL,
    quantity double precision NOT NULL,
    "unitPrice" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL
);


--
-- Name: Supermarket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Supermarket" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    name text NOT NULL,
    phone text,
    address text,
    "gstNumber" text,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "supermarketId" text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    name text NOT NULL,
    pin text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Customer" (id, "supermarketId", name, phone, "flatNumber") FROM stdin;
dd48f08b-89e2-4f13-bbbd-150a5643431e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Flat 7A1	\N	7A1
e64c37a6-de24-4d47-a4d3-fa52073fc026	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Flat 3B1	\N	3B1
b949d4bd-fef5-49b6-85b2-9ad348662a19	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Flat 13 B3	\N	13 B3
f5672570-85c8-48eb-9499-fca42d3e4d8e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Flat 15 C2	\N	15 C2
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Expense" (id, "supermarketId", title, amount, category, date, note, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "supermarketId", title, message, type, link, "isRead", "createdAt") FROM stdin;
86c5772d-fc32-440d-a6c9-7293d9f981d4	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Low Stock Alert	21 batches are running low on stock (< 10 units).	WARNING	/dashboard/stock	f	2026-02-05 08:09:28.756
55b1f1f4-f9a2-4af2-ba60-a3a73493a190	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Expiry Warning	2 batches are expiring within 30 days.	WARNING	/dashboard/stock	t	2026-02-05 09:33:24.122
3a990143-aa42-4861-9825-3133cf0b11e6	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Expiry Warning	2 batches are expiring within 30 days.	WARNING	/dashboard/stock	t	2026-02-05 12:30:34.598
1af01e90-76ea-4885-84fd-3ea12116f643	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Expiry Warning	2 batches are expiring within 30 days.	WARNING	/dashboard/stock	f	2026-02-05 15:18:23.372
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "supermarketId", "customerId", amount, date, note, type, "paymentMode") FROM stdin;
25406c0e-fbba-4c13-8d04-90aac4618785	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	dd48f08b-89e2-4f13-bbbd-150a5643431e	45.000000000000000000000000000000	2026-02-05 15:01:20.793	UPI	CREDIT_PAYMENT	CASH
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, "supermarketId", name, barcode, category, brand, unit, "costPrice", "sellingPrice", "taxPercent", "minStockLevel", "isActive", "createdAt", "updatedAt") FROM stdin;
a113fa7a-f1dd-4f04-b57c-286330d1d2d3	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Potato	1001	Vegetable	Nostro	1 Kg	20.000000000000000000000000000000	29.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:11.373	2026-02-05 06:20:11.373
d605ddae-019d-4f30-b484-f9b7e7ba0180	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Onion	1002	Vegetable	Nostro	1 Kg	0.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:11.756	2026-02-05 06:20:11.756
926119be-1158-4cba-bac7-bb876764775e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tomato	1003	Vegetable	Nostro	1 Kg	20.000000000000000000000000000000	24.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:11.933	2026-02-05 06:20:11.933
f7eaa8e5-3e1f-41aa-9d90-1b031a47aff5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Cabbage	1004	Vegetable	Nostro	1 Kg	22.000000000000000000000000000000	35.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:12.109	2026-02-05 06:20:12.109
a41321c1-4731-46be-bd76-7c53d1460a16	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Cauliflower	1005	Vegetable	Nostro	1 Kg	30.000000000000000000000000000000	40.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:12.286	2026-02-05 06:20:12.286
d7f46f99-4382-4372-884b-23de74b6109b	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Capsicum	1006	Vegetable	Nostro	1 Kg	60.000000000000000000000000000000	80.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:12.461	2026-02-05 06:20:12.461
947539a2-2b8f-4b2d-951e-3a8ed29e3e16	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Payar	1007	Vegetable	Nostro	1 Kg	50.000000000000000000000000000000	70.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:12.637	2026-02-05 06:20:12.637
be05dca7-132b-4f82-aa36-633e7c483659	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Brinjal	1008	Vegetable	Nostro	1 Kg	35.000000000000000000000000000000	50.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:12.813	2026-02-05 06:20:12.813
cb442383-7b8b-4861-9105-5962581707c4	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Vellari	1009	Vegetable	Nostro	1 Kg	20.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:12.989	2026-02-05 06:20:12.989
6e15e739-f797-4ddd-82f1-47f0f42d29ae	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Venda	1010	Vegetable	Nostro	1 Kg	40.000000000000000000000000000000	60.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:13.166	2026-02-05 06:20:13.166
e37123ad-b974-41a0-aa7a-8767ea131f0f	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Garlic	1011	Vegetable	Nostro	1 Kg	150.000000000000000000000000000000	200.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:13.343	2026-02-05 06:20:13.343
9f9df6fb-6264-4411-83a3-0c956417609a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ginger	1012	Vegetable	Nostro	1 Kg	65.000000000000000000000000000000	100.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:13.52	2026-02-05 06:20:13.52
343dac66-1911-45d3-aac9-8551a414960a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Chilly	1013	Vegetable	Nostro	1 Kg	60.000000000000000000000000000000	80.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:13.695	2026-02-05 06:20:13.695
24c655ee-f53d-4be1-84d3-cb079a116f84	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Curry Leaf	1014	Vegetable	Nostro	1 Kg	95.000000000000000000000000000000	150.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:13.872	2026-02-05 06:20:13.872
cabba431-59ee-458b-aa70-d7102cc95f3b	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Coriander Leaf	1015	Vegetable	Nostro	1 Kg	60.000000000000000000000000000000	100.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:14.047	2026-02-05 06:20:14.047
aba19b15-8355-44c0-8b12-b4752a2e5466	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Mint Leaf	1016	Vegetable	Nostro	1 Kg	60.000000000000000000000000000000	100.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:14.223	2026-02-05 06:20:14.223
4d623ad0-da9d-438b-ac94-3e93cf890f8a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Mathaan	1017	Vegetable	Nostro	1 Kg	20.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:14.398	2026-02-05 06:20:14.398
87b0f38b-720b-4591-9ad2-c1cdd7180ca6	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Elavan	1018	Vegetable	Nostro	1 Kg	20.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:14.575	2026-02-05 06:20:14.575
0c6b0140-bb85-4092-8a5e-2d73c9b4898c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Small Onion	1019	Vegetable	Nostro	1 Kg	48.000000000000000000000000000000	70.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:14.751	2026-02-05 06:20:14.751
a056bcc0-a3d8-4a73-abff-fdc2ba0b6542	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Lemon	1020	Vegetable	Nostro	1 Kg	50.000000000000000000000000000000	60.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:14.928	2026-02-05 06:20:14.928
4d08148e-1214-40fb-8bfc-8cc033070930	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Banana	1021	Vegetable	Nostro	1 Kg	35.000000000000000000000000000000	45.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:15.104	2026-02-05 06:20:15.104
f4860788-c8eb-44d0-ad31-cb91237ddc6e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Njali Poovan	1022	Vegetable	Nostro	1 Kg	69.000000000000000000000000000000	80.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:15.28	2026-02-05 06:20:15.28
47988dda-1895-4138-9722-a17ecf455070	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Pavizham Matta Rice	1023	Rice	Nostro	1 Kg	55.000000000000000000000000000000	60.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:15.456	2026-02-05 06:20:15.456
eabcab97-b73f-4c23-94ee-e390dd23b09b	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	3 Man Rose Kaima	1024	Rice	Nostro	1 Kg	180.000000000000000000000000000000	220.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:15.631	2026-02-05 06:20:15.631
6a9537be-1c06-4664-aaba-7d31b4d29674	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	IR8 Raw Rice	1025	Rice	Nostro	1 Kg	45.000000000000000000000000000000	50.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:15.809	2026-02-05 06:20:15.809
1f4cde06-d849-4356-b650-d6bd689baa7a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	MP Coconut Oil Pouch	1032	Oil	Nostro	1 Packet	178.000000000000000000000000000000	204.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:17.04	2026-02-05 06:20:17.04
f80d5c52-c2b8-4647-b33a-c95dbc5ede23	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Liberty Sunflower Oil	1033	Oil	Nostro	1 Packet	85.000000000000000000000000000000	97.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:17.216	2026-02-05 06:20:17.216
d83c09ce-7d31-4abc-be77-af125cee6d03	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Pavan Gingelly Oil	1034	Oil	Nostro	1 Bottle	115.000000000000000000000000000000	133.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:17.391	2026-02-05 06:20:17.391
5b7f1117-a941-40e4-b4ff-62d96b946001	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	RG Gingelly Oil 500	1035	Oil	Nostro	1 Bottle	125.000000000000000000000000000000	149.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:17.566	2026-02-05 06:20:17.566
c3ce73e3-57a2-4d5f-995e-7a5ba9ea198e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Nalla Jeerakam	1036	Spices	Nostro	1 Packet	38.000000000000000000000000000000	52.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:17.742	2026-02-05 06:20:17.742
11a42c2f-b413-4a80-8d37-971a88dfbe6f	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Perum Jeerakam	1037	Spices	Nostro	1 Packet	26.000000000000000000000000000000	480.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:17.918	2026-02-05 06:20:17.918
1dc784da-c211-412a-9227-341ba89a3070	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Uluva	1038	Spices	Nostro	1 Packet	12.000000000000000000000000000000	140.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:18.093	2026-02-05 06:20:18.093
4dcfefb0-57f7-4ca3-8e8c-50a59906079b	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kaduk	1039	Spices	Nostro	1 Packet	11.000000000000000000000000000000	120.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:18.269	2026-02-05 06:20:18.269
0ea0e8ad-c601-421e-b0b9-fe4fd7169272	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Eastern Sambar Powder	1040	Masala	Nostro	1 Packet	48.000000000000000000000000000000	51.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:18.445	2026-02-05 06:20:18.445
237ad48a-60a9-40b0-8f9d-fceff154f31a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Eastern Rasam Powder	1041	Masala	Nostro	1 Packet	52.000000000000000000000000000000	56.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:18.62	2026-02-05 06:20:18.62
6fe0d303-fc0b-4195-a776-9f59f0fa1262	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Eastern Black Pepper	1042	Masala	Nostro	1 Packet	60.000000000000000000000000000000	63.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:18.795	2026-02-05 06:20:18.795
bbe2aed1-0801-48c6-8eff-4b489a801ab3	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kitchen Treasure Fish Masala	1043	Masala	Nostro	1 Packet	42.000000000000000000000000000000	47.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:18.971	2026-02-05 06:20:18.971
c614ec30-f181-476c-8a43-1a5cb5b3780e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Eastern Chicken Masala	1044	Masala	Nostro	1 Packet	50.000000000000000000000000000000	55.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:19.146	2026-02-05 06:20:19.146
4864cf04-fefc-47ff-a812-bc3b4a94bc32	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kabooli Kadala	1028	Pulses	Nostro	1 kg	150.000000000000000000000000000000	190.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:16.336	2026-02-05 14:08:05.854
f3794610-763e-48c1-8d98-f5f73a71169d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kadala	1026	Pulses	Nostro	1 Kg	136.000000000000000000000000000000	160.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:15.984	2026-02-05 14:08:15.997
7fe19433-7dfb-4232-8906-08c453642089	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Uzhunnu Ball	1031	Pulses	Nostro	1 Kg	130.000000000000000000000000000000	160.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:16.863	2026-02-05 14:08:36.776
e3415b27-2d1b-4f9b-b408-c9a2b8007f74	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Green Peas	1029	Pulses	Nostro	1 Kg	120.000000000000000000000000000000	180.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:16.511	2026-02-05 14:08:49.951
4097c2fe-746c-4599-95e2-4080e492e6c7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Parippu	1030	Pulses	Nostro	1 Kg	140.000000000000000000000000000000	200.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:16.688	2026-02-05 14:09:22.924
a85883cf-7914-4e7d-88de-d5a8c3b4893d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Eastern Biriyani Masala	1045	Masala	Nostro	1 Packet	58.000000000000000000000000000000	62.500000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:19.322	2026-02-05 06:20:19.322
0db97b8a-dab4-4b79-8260-f090a5d26868	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Eastern Garam Masala	1046	Masala	Nostro	1 Packet	50.000000000000000000000000000000	54.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:19.5	2026-02-05 06:20:19.5
3ee4b9ed-94ee-4734-bfa4-9cc5a6a2c5e0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kitchen Treasures Corriander	1047	Masala	Nostro	1 Packet	22.000000000000000000000000000000	25.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:19.676	2026-02-05 06:20:19.676
736fc8df-7fc9-4074-85ba-6e7037503793	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kitchen Treasure  Tumeric	1048	Masala	Nostro	1 Packet	33.000000000000000000000000000000	36.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:19.851	2026-02-05 06:20:19.851
97180d57-1c48-45fa-8ed1-45e7d9a8271d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kitchen Treasure Kashmiri	1049	Masala	Nostro	1 Packet	47.000000000000000000000000000000	52.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:20.027	2026-02-05 06:20:20.027
d213f4cb-05e7-4288-b21e-fb941e19fe80	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tasty Kismis & Cashew	1050	Spices	Nostro	1 Packet	18.000000000000000000000000000000	22.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:20.203	2026-02-05 06:20:20.203
67e8daa2-2c84-4a32-9c91-fce50f6c1401	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tasty Elam	1051	Spices	Nostro	1 Packet	17.500000000000000000000000000000	22.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:20.378	2026-02-05 06:20:20.378
01d06378-50ce-4362-9afe-6eed56b27533	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tasty  Cashew	1052	Spices	Nostro	1 Packet	18.000000000000000000000000000000	22.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:20.554	2026-02-05 06:20:20.554
8ecfb363-f475-4d12-b01e-e22e5729301f	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tasty Kismis	1053	Spices	Nostro	1 Packet	8.500000000000000000000000000000	12.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:20.729	2026-02-05 06:20:20.729
63d0c890-1536-456b-81a1-ca3b0d2bf358	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tasty Curry Masala	1054	Spices	Nostro	1 Packet	8.500000000000000000000000000000	12.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:20.905	2026-02-05 06:20:20.905
0ccd1ea3-55a5-4e56-8bbd-0adfae15b6a8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tasty Curry Masala (Biriyani)	1055	Spices	Nostro	1 Packet	17.000000000000000000000000000000	22.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:21.08	2026-02-05 06:20:21.08
6b0d953c-1f91-4097-8cdf-7d12b344c890	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tasty Red Chilly	1056	Spices	Nostro	1 Packet	8.000000000000000000000000000000	12.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:21.258	2026-02-05 06:20:21.258
68381dc3-10aa-49ab-9e2c-8fb6659ca05e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Chalk - Cockroach	1057	Home care	Nostro	1 Packet	0.000000000000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:21.434	2026-02-05 06:20:21.434
b76c47dd-9b43-4fb4-b029-ed292564a91d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Sugar	1058	Essentials	Nostro	1 Kg	45.000000000000000000000000000000	48.000000000000000000000000000000	0.000000000000000000000000000000	3	t	2026-02-05 06:20:21.609	2026-02-05 06:20:21.609
cae5d0df-9937-4f27-9e1d-fabe5e931826	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ponni Rice	1059	Rice	Nostro	1 Kg	55.000000000000000000000000000000	60.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:21.959	2026-02-05 06:20:21.959
47330d1e-196e-44f0-becb-b00cab24aa32	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ashirvad Salt Powder	1060	Essentials	Nostro	1 Packet	19.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:22.134	2026-02-05 06:20:22.134
435dd281-e5f2-4710-b106-ec539bd08d68	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milk -Milma Prime	1061	Diary	Nostro	1 Packet	27.000000000000000000000000000000	28.000000000000000000000000000000	0.000000000000000000000000000000	5	t	2026-02-05 06:20:22.309	2026-02-05 06:20:22.309
f19638bb-61b1-4b78-a135-a8b3f4d90f47	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Egg	1062	Diary	Nostro	1 Piece	5.900000000000000000000000000000	7.000000000000000000000000000000	0.000000000000000000000000000000	30	t	2026-02-05 06:20:22.485	2026-02-05 06:20:22.485
f42f4989-6901-4593-af7a-a2a84b4db5e2	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Water Bottle (2 ltr)	1063	Beverages	Nostro	1 Bottle	0.000000000000000000000000000000	35.000000000000000000000000000000	0.000000000000000000000000000000	5	t	2026-02-05 06:20:22.661	2026-02-05 06:20:22.661
8fc26424-df23-421c-8c1d-a69da40b2fe9	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Water Bottle (500ml)	1064	Beverages	Nostro	1 Bottle	0.000000000000000000000000000000	10.000000000000000000000000000000	0.000000000000000000000000000000	5	t	2026-02-05 06:20:22.837	2026-02-05 06:20:22.837
d83293a9-a19c-4018-9e5b-422eb6566fea	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Pappadam	1065	Essentials	Nostro	1 Packet	18.000000000000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	3	t	2026-02-05 06:20:23.012	2026-02-05 06:20:23.012
cf370f63-f2c4-481c-94be-bb32eb2c4c6c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Battery -Small	1066	Household & Utilities	Nostro	1 Piece	11.000000000000000000000000000000	17.000000000000000000000000000000	0.000000000000000000000000000000	5	t	2026-02-05 06:20:23.188	2026-02-05 06:20:23.188
07f34f49-fafd-4eb1-97b5-9505ed36e5b0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Battery -big	1067	Household & Utilities	Nostro	1 Piece	11.000000000000000000000000000000	17.000000000000000000000000000000	0.000000000000000000000000000000	5	t	2026-02-05 06:20:23.364	2026-02-05 06:20:23.364
68d01b22-05bc-4529-8957-03ac6bdbd445	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	White Kuruva Rice	1068	Rice	Nostro	1 Kg	0.000000000000000000000000000000	50.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:23.539	2026-02-05 06:20:23.539
1a82dd56-03fa-4f30-9ca5-108d003f488c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Close up paste	1069	Personal care	Nostro	1 Piece	0.000000000000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	5	t	2026-02-05 06:20:23.715	2026-02-05 06:20:23.715
228d839a-1ab6-4f06-b2e6-adbef9f81e7d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Gillette shaving Cream	1070	Personal care	Nostro	1 Piece	0.000000000000000000000000000000	14.000000000000000000000000000000	0.000000000000000000000000000000	5	t	2026-02-05 06:20:23.89	2026-02-05 06:20:23.89
878a443c-7a3c-4cb0-bd98-cc9c03d05c19	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Elite Bread - Normal	1071	Diary	Nostro	1 Piece	39.000000000000000000000000000000	45.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:24.066	2026-02-05 06:20:24.066
0608feb6-92b8-4833-a2c5-527ee1cdb114	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Elite Bread - BRown	1072	Diary	Nostro	1 Piece	48.000000000000000000000000000000	55.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:24.241	2026-02-05 06:20:24.241
4a7edf58-6a68-46be-a63e-7822f9bfaf6f	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Elite Chapati	1073	Ready to Cook	Nostro	1 Piece	42.000000000000000000000000000000	53.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:24.416	2026-02-05 06:20:24.416
f660f568-e2d3-4662-88db-f1645d260fad	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Elite Cake - 10	1074	Snacks	Nostro	1 Piece	9.000000000000000000000000000000	10.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:24.593	2026-02-05 06:20:24.593
26b155d6-9643-4d5c-b73f-6709eecd97d8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Elite Cake -40	1075	Snacks	Nostro	1 Piece	35.000000000000000000000000000000	40.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:24.769	2026-02-05 06:20:24.769
983a9079-b72b-4955-ad79-8cdc5e654fda	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ghee - Milma -Big	1076	Diary	Nostro	1 Piece	138.000000000000000000000000000000	145.000000000000000000000000000000	0.000000000000000000000000000000	3	t	2026-02-05 06:20:24.945	2026-02-05 06:20:24.945
2832bd62-7b05-4f03-99ba-96af3c271df0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Pears Soap	1077	Personal care	Nostro	1 Piece	0.000000000000000000000000000000	35.000000000000000000000000000000	0.000000000000000000000000000000	3	t	2026-02-05 06:20:25.121	2026-02-05 06:20:25.121
97128cbb-b1d0-4476-baf4-39310713228d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milma Curd packet	1079	Diary	Nostro	1 Packet	33.000000000000000000000000000000	35.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:25.472	2026-02-05 06:20:25.472
21b2da05-ae8a-456c-bdcc-b4d6df6439cd	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Coconut	1080	Vegetable	Nostro	1 Piece	22.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	3	t	2026-02-05 06:20:25.647	2026-02-05 06:20:25.647
4bc5d2c5-ca2d-44ef-ae86-9c8f966aa6d4	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Carrot	1081	Vegetable	Nostro	1 Kg	38.000000000000000000000000000000	45.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:25.822	2026-02-05 06:20:25.822
1f42441f-cea4-49b0-ad02-ab8f290afbb7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Beetroot	1082	Vegetable	Nostro	1 Kg	30.000000000000000000000000000000	40.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 06:20:25.998	2026-02-05 06:20:25.998
2e57bf68-514b-462a-b407-1c6b43630053	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Sharkara	1083	Essentials	Nostro	1 Kg	64.000000000000000000000000000000	80.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 08:45:47.381	2026-02-05 08:45:47.381
bc6d2664-3b1f-4183-a2cf-06a6bcdf6deb	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Podiyari Rice	1084	Rice	Nostro	1 Kg	54.000000000000000000000000000000	62.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:47.929	2026-02-05 08:45:47.929
29b345f9-610b-4eb7-b624-7441e4f1a383	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Podiyari Thadi	1085	Rice	Nostro	1 Kg	54.000000000000000000000000000000	58.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:48.106	2026-02-05 08:45:48.106
8582a0bd-84ba-4a27-a808-c9acc493eb04	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Puli 1st	1086	Essentials	Nostro	1 Kg	176.000000000000000000000000000000	230.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 08:45:48.283	2026-02-05 08:45:48.283
ea203e57-af8b-49c7-a8c7-92e486b2dc75	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Aashirvaad Super - Atta	1087	Essentials	Nostro	1 Kg	70.000000000000000000000000000000	74.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:48.461	2026-02-05 08:45:48.461
114643b7-272f-4ae7-b5af-893680757c9d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ajmi Steam Puttupodi	1088	Essentials	Nostro	1 Packet	36.000000000000000000000000000000	46.500000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 08:45:48.639	2026-02-05 08:45:48.639
2e039eaf-5a8e-43d4-823c-34d500528755	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ajmi Steam Pathiri	1089	Essentials	Nostro	1 Packet	36.000000000000000000000000000000	46.500000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:48.819	2026-02-05 08:45:48.819
d881de69-a3ba-43b7-bd17-4edec37a813a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Corn Flour	1090	Essentials	Nostro	1 Kg	70.000000000000000000000000000000	90.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 08:45:48.996	2026-02-05 08:45:48.996
ec6988db-7785-45a3-adca-dd23067228b8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kitchen Treasure - Normal chilli	1091	Masala	Nostro	1 Packet	21.000000000000000000000000000000	26.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 08:45:49.173	2026-02-05 08:45:49.173
afeeca32-7810-4d4e-8340-49ff94c576a8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ponkathir Broken - Wheat	1092	Essentials	Nostro	1 Packet	48.000000000000000000000000000000	54.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:49.351	2026-02-05 08:45:49.351
c3b3a3f1-af77-4d79-ba00-8fa9c3ea2895	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Elite Maida 500 GM	1093	Essentials	Nostro	1 Packet	37.000000000000000000000000000000	40.500000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:49.528	2026-02-05 08:45:49.528
c4467da5-76dc-410f-9ce1-9743b5082ba7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Soda 750ML	1094	Beverages	Nostro	1 Bottle	17.000000000000000000000000000000	18.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 08:45:49.706	2026-02-05 08:45:49.706
22eff87a-e2d5-4bc3-90c3-2228b71f0f4e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	VSR Rice Kuruva	1095	Rice	Nostro	1 Kg	50.000000000000000000000000000000	55.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:49.885	2026-02-05 08:45:49.885
da5819dc-a344-486a-887f-abadbe246ca8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Rose Brand Kaima Rice	1096	Rice	Nostro	1 Kg	200.000000000000000000000000000000	240.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:50.062	2026-02-05 08:45:50.062
4dd1a7c2-d58a-4864-945e-8d1c3f14ee42	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Amul Butter Salted	1097	Diary	Nostro	1 Packet	56.000000000000000000000000000000	58.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:50.241	2026-02-05 08:45:50.241
9eeabb18-9aa2-45bb-a22c-29ecbbf5920c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Amul Butter Unsalted	1098	Diary	Nostro	1 Packet	59.000000000000000000000000000000	61.000000000000000000000000000000	0.000000000000000000000000000000	0	t	2026-02-05 08:45:50.418	2026-02-05 08:45:50.418
9d5532ca-6247-455f-9d2f-f9471f4372b7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Munch Rs10	1099	Choclates	Nostro	1 Piece	9.699999999999999000000000000000	10.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:50.595	2026-02-05 08:45:50.595
02d26107-641b-472e-a7ac-32c2af94e1fe	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Snickers Peanut 14g	1100	Choclates	Nostro	1 Piece	9.100000000000000000000000000000	10.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:50.773	2026-02-05 08:45:50.773
b555cc65-c8a9-481f-88ca-d33245728e96	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	KitKat 3 Finger	1101	Choclates	Nostro	1 Piece	24.000000000000000000000000000000	25.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:50.95	2026-02-05 08:45:50.95
7e8bc9f2-92a9-4c9c-bcb5-45d7f0e949ac	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Nestle KitKat Milk	1102	Choclates	Nostro	1 Piece	9.600000000000000000000000000000	10.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:51.131	2026-02-05 08:45:51.131
910349e2-d4ca-4079-a749-d7ee89eb5de5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Snickers 25g	1103	Choclates	Nostro	1 Piece	16.000000000000000000000000000000	18.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:51.308	2026-02-05 08:45:51.308
0ffdfeb1-d65b-4b98-ad70-2f806feda001	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Cadbury Dairy Milk	1104	Choclates	Nostro	1 Piece	19.500000000000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:51.485	2026-02-05 08:45:51.485
ed9ef888-a6c7-48b2-b4fc-f6fd3a2699d0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Nestle Munch	1105	Choclates	Nostro	1 Piece	4.880000000000000000000000000000	5.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:51.662	2026-02-05 08:45:51.662
1f9b0b86-4afb-411f-9cd7-f4f16b9f20c5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Lil Bites Cotton Candy	1106	Icecreams	Nostro	1 Piece	4.252500000000000000000000000000	5.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:51.839	2026-02-05 08:45:51.839
80c0a9d3-e844-4fbd-b0e9-beebfb1078f0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Lil Bites Choco Toffee	1107	Icecreams	Nostro	1 Piece	4.252500000000000000000000000000	5.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:52.016	2026-02-05 08:45:52.016
2efe28e3-0f70-40e6-92dd-b7678b4b6979	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Popitos Kaccha Mango	1108	Icecreams	Nostro	1 Piece	4.252500000000000000000000000000	5.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:52.193	2026-02-05 08:45:52.193
e4ab569e-c068-4280-affc-14a1b2626bd0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Popitos Apple Bar 22ML	1109	Icecreams	Nostro	1 Piece	4.252000000000000000000000000000	5.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:52.37	2026-02-05 08:45:52.37
4dd43df6-f17a-47b9-b9ae-33ca2619dcee	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Lickstick Grape Bar 50ML	1110	Icecreams	Nostro	1 Piece	12.295000000000000000000000000000	15.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:52.547	2026-02-05 08:45:52.547
ae2fdf74-5886-4738-817d-6a24986531d8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Lickstick Mango Bar 50ML	1111	Icecreams	Nostro	1 Piece	12.295000000000000000000000000000	15.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:52.724	2026-02-05 08:45:52.724
7dec121a-1c69-49a5-9b50-7c33d5a7aae7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Merry Creme 55ML	1112	Icecreams	Nostro	1 Piece	16.400000000000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:52.904	2026-02-05 08:45:52.904
de35248a-6562-494e-9fc1-af533f16c319	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Spiral Bar 60ML	1113	Icecreams	Nostro	1 Piece	16.400000000000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:53.081	2026-02-05 08:45:53.081
19af4dc6-61ef-4e8f-9201-7510b3eb1c2d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Neapolitan Cup 60ML	1114	Icecreams	Nostro	1 Piece	16.400000000000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:53.257	2026-02-05 08:45:53.257
fc5c2529-fbd8-4fe9-8166-cee2b87197d1	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Two in One Mango 60ML	1115	Icecreams	Nostro	1 Piece	24.602000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:53.434	2026-02-05 08:45:53.434
5550b090-8293-4e34-ada6-3b916af3ba51	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Choco Bar 60ML	1116	Icecreams	Nostro	1 Piece	24.601666670000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:53.612	2026-02-05 08:45:53.612
dfbe3e0c-38a9-4648-9306-351fc53de2e1	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	CC IC Sandwich 60ML	1117	Icecreams	Nostro	1 Piece	24.602000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:53.788	2026-02-05 08:45:53.788
e492a32c-8bf1-49c4-acb5-34ded825a8b5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Caramel IC Sandwich 60ML	1118	Icecreams	Nostro	1 Piece	24.602000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:53.966	2026-02-05 08:45:53.966
6b5dfcd2-7a41-4acd-bb7a-38c3b495626e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	BS-C Candy Whirl Bar	1119	Icecreams	Nostro	1 Piece	24.602000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:54.142	2026-02-05 08:45:54.142
33a4d4fe-31bb-4678-9c7d-af1e69c78b8a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Water Melon Bar 60ML	1120	Icecreams	Nostro	1 Piece	20.496000000000000000000000000000	25.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:54.32	2026-02-05 08:45:54.32
180b0787-f024-4f32-83b5-2410a6a49be7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Almond Crunch IC Bar	1121	Icecreams	Nostro	1 Piece	73.795000000000000000000000000000	90.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:54.497	2026-02-05 08:45:54.497
3b6b9d35-cf39-41fa-be82-de0bb1af0b6c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kulfi King Roll 60ML	1122	Icecreams	Nostro	1 Piece	41.002000000000000000000000000000	50.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:54.675	2026-02-05 08:45:54.675
5ad02031-e6bd-4e18-9755-91981425a3b5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Belgium Choco Bar 45ML	1123	Icecreams	Nostro	1 Piece	41.002000000000000000000000000000	50.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:54.853	2026-02-05 08:45:54.853
3fbc7d10-6b80-40b1-8e17-8c078ac39a24	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milk Fantasy Cup 40ML	1124	Icecreams	Nostro	1 Piece	8.200833333000000000000000000000	10.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:55.03	2026-02-05 08:45:55.03
8aac47d2-ea4a-47a5-a7a9-42ee1891f31e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Vanilla Cup 60ML	1125	Icecreams	Nostro	1 Piece	16.400833330000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:55.206	2026-02-05 08:45:55.206
6c85fc18-8514-4718-883d-49e2ba73e450	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Double Choc iCone 100ML	1126	Icecreams	Nostro	1 Piece	41.002500000000000000000000000000	50.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:55.383	2026-02-05 08:45:55.383
7ea6d19f-5bab-4419-88ec-5346521b06b0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	BSCO iCone 100ML	1127	Icecreams	Nostro	1 Piece	41.002500000000000000000000000000	50.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:55.56	2026-02-05 08:45:55.56
66e73fce-0a19-4131-9a3b-8a9212e960cc	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Vanilla iCone 50ML	1128	Icecreams	Nostro	1 Piece	24.602000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:55.736	2026-02-05 08:45:55.736
6186659c-1ced-4a40-9b19-d984c6e0f038	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	IC Shake Chocolate 90ML	1129	Icecreams	Nostro	1 Piece	32.802500000000000000000000000000	40.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:55.914	2026-02-05 08:45:55.914
ac1a0e33-7e53-4b58-bd21-35b6b45bd8c0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Vanilla Tub 500ML	1130	Icecreams	Nostro	1 Piece	123.000000000000000000000000000000	150.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:56.091	2026-02-05 08:45:56.091
930265a8-1806-42f7-acf8-f54ba2644fbc	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Butterscotch Tub 500ML	1131	Icecreams	Nostro	1 Piece	139.400000000000000000000000000000	170.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:56.268	2026-02-05 08:45:56.268
4c38462d-a3cc-499c-8a70-b5055510aaf4	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Strawberry Tub 500ML	1132	Icecreams	Nostro	1 Piece	123.000000000000000000000000000000	150.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:56.446	2026-02-05 08:45:56.446
5d03ae97-9940-487b-aa35-878af47dfbc8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Tender Coconut Tub 500ML	1133	Icecreams	Nostro	1 Piece	163.990000000000000000000000000000	200.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:56.623	2026-02-05 08:45:56.623
9149f0ca-fcaa-4f27-8856-4db7fc1ee909	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Mango Tub 500ML	1134	Icecreams	Nostro	1 Piece	163.990000000000000000000000000000	200.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:56.799	2026-02-05 08:45:56.799
de62036e-73bf-4b5f-9a97-ed8d9a477b84	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Chocolate Tub 500ML	1135	Icecreams	Nostro	1 Piece	147.590000000000000000000000000000	180.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:56.976	2026-02-05 08:45:56.976
31293f71-db78-4e8e-a784-a709904507a5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Strawberry Cup 60ML	1136	Icecreams	Nostro	1 Piece	16.400833330000000000000000000000	20.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:57.154	2026-02-05 08:45:57.154
c9ab7128-4063-42f5-9c19-ebc6b7ea1714	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Casatta slice	1137	Icecreams	Nostro	1 Piece	65.603333330000000000000000000000	80.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:57.331	2026-02-05 08:45:57.331
a475b5d0-7d00-41cd-8b02-53ba58432676	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Ashirvad Rock Salt	1138	Essentials	Nostro	1 Packet	12.000000000000000000000000000000	22.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:45:57.507	2026-02-05 08:45:57.507
d6e097fb-8a28-48fd-92e2-e62e4f7aaedc	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Kinder creamy	1139	Choclates	Nostro	1 piece	23.800000000000000000000000000000	25.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 08:59:10.999	2026-02-05 08:59:10.999
8bdda71c-7e17-444e-9517-26d1a102fe97	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Snacks-30	1141	Snacks	Nostro	1 packet	23.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 09:31:05.481	2026-02-05 09:31:05.481
7eebfb3b-6bd4-446f-864b-d5bca2191add	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Snacks -40	1140	Snacks	Nostro	1 packet	30.000000000000000000000000000000	40.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 09:30:31.64	2026-02-05 09:31:45.202
04e0026b-f453-448e-8093-6613aa1ecf77	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Medimix Soap	1078	Personal care	Nostro	1 Piece	47.000000000000000000000000000000	52.000000000000000000000000000000	0.000000000000000000000000000000	2	t	2026-02-05 06:20:25.296	2026-02-05 11:53:46.359
f602879f-1598-4085-8e8a-378aaefe0f39	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Amul Mithai Mate	1142	Essentials	Nostro	1 piece	116.000000000000000000000000000000	122.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 13:03:41.305	2026-02-05 13:03:41.305
0cf260dc-dd0c-4c65-949f-38ab6311a7e2	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Cherupayar Loose	1027	Pulses	Nostro	1 Kg	130.000000000000000000000000000000	160.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 06:20:16.16	2026-02-05 14:06:58.443
66f9cfc1-d27a-4764-8063-aad5f088d8d3	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milma Jooy	1143	Diary	Nostro	1 Piece	25.000000000000000000000000000000	29.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 15:07:50.649	2026-02-05 15:07:50.649
1eb97f73-859d-40b5-8e6a-8d247d4a3bf8	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milma Peda	1144	Diary	Nostro	1 Piece	4.500000000000000000000000000000	5.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 15:07:51.025	2026-02-05 15:07:51.025
ffc7c896-22b7-4a88-9e04-fd37749dead0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milma cup curd small	1145	Diary	Nostro	1 Piece	32.000000000000000000000000000000	35.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 15:07:51.201	2026-02-05 15:07:51.201
aeb61756-0129-4eb7-992b-c7c8f0ebf622	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milma cup curd big	1146	Diary	Nostro	1 Piece	60.000000000000000000000000000000	65.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 15:07:51.376	2026-02-05 15:07:51.376
4d3da416-b404-4873-afd2-10565cc5a9dd	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milma probiotic curd	1147	Diary	Nostro	1 Piece	37.000000000000000000000000000000	40.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 15:07:51.551	2026-02-05 15:07:51.551
5c7eb954-3b29-466e-be8d-ee56c33e5284	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Milma Green Super rich	1148	Diary	Nostro	1 Piece	29.000000000000000000000000000000	30.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 15:07:51.726	2026-02-05 15:07:51.726
56ed0167-cebf-483e-83b4-d1059c8382c3	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	Gillette Shaving Stick	1149	Diary	Nostro	1 Piece	21.000000000000000000000000000000	25.000000000000000000000000000000	0.000000000000000000000000000000	1	t	2026-02-05 15:07:51.901	2026-02-05 15:07:51.901
\.


--
-- Data for Name: ProductBatch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductBatch" (id, "productId", "batchNumber", "expiryDate", quantity, "purchaseId", "createdAt", "updatedAt") FROM stdin;
50d6583a-08c8-4f2e-bec5-685d9009f30f	7fe19433-7dfb-4232-8906-08c453642089	BTC_1	2026-12-31 00:00:00	8.5	\N	2026-02-05 08:10:49.393	2026-02-05 08:26:56.418
3b1ef82e-d26d-4cc3-87f0-fbd8face8ce5	d83c09ce-7d31-4abc-be77-af125cee6d03	BTC_1	2026-12-31 00:00:00	3	\N	2026-02-05 08:10:50.361	2026-02-05 08:26:57.238
d5bd81ea-ec16-4dc7-ab27-1854d974584f	f602879f-1598-4085-8e8a-378aaefe0f39	BTC_1	2026-06-27 00:00:00	2	\N	2026-02-05 13:04:28.973	2026-02-05 13:06:53.879
c11db5e2-dba2-4b80-85fa-2d7768d23b46	5ad02031-e6bd-4e18-9755-91981425a3b5	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:52:45.95	2026-02-05 13:07:06.531
b66c6a93-fe51-47b7-885e-a0678029c7d9	dfbe3e0c-38a9-4648-9306-351fc53de2e1	BTC_1	2026-12-31 00:00:00	0	\N	2026-02-05 08:52:43.89	2026-02-05 08:52:43.89
5c6118a2-99aa-4898-9453-0bb3e2ec26f9	6b5dfcd2-7a41-4acd-bb7a-38c3b495626e	BTC_1	2026-12-31 00:00:00	8	\N	2026-02-05 08:52:44.577	2026-02-05 08:52:44.577
9d85eb8d-b812-4508-bec0-1d07baf16b3a	3b6b9d35-cf39-41fa-be82-de0bb1af0b6c	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:52:45.607	2026-02-05 08:52:45.607
4adedc79-cbaf-4b64-805c-205947f399a8	3fbc7d10-6b80-40b1-8e17-8c078ac39a24	BTC_1	2026-12-31 00:00:00	24	\N	2026-02-05 08:52:46.294	2026-02-05 08:52:46.294
b9a32038-1bbb-43a7-b036-0d90a9b83ce5	8aac47d2-ea4a-47a5-a7a9-42ee1891f31e	BTC_1	2026-12-31 00:00:00	24	\N	2026-02-05 08:52:46.808	2026-02-05 08:52:46.808
55651455-950a-435e-abfa-b155335cb101	ac1a0e33-7e53-4b58-bd21-35b6b45bd8c0	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 08:52:48.527	2026-02-05 08:52:48.527
7bfe91c8-d10d-41cc-beaf-ffdbd481e07a	930265a8-1806-42f7-acf8-f54ba2644fbc	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 08:52:48.87	2026-02-05 08:52:48.87
9de3a62f-5c3e-48b0-a760-cc77db8abf0f	4c38462d-a3cc-499c-8a70-b5055510aaf4	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:49.214	2026-02-05 08:52:49.214
4e74e8be-bdcb-41e7-8b6f-7a1ad6eb3c2d	5d03ae97-9940-487b-aa35-878af47dfbc8	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:49.557	2026-02-05 08:52:49.557
bac2cb52-1ce8-4374-b21a-79ec96e31e81	9149f0ca-fcaa-4f27-8856-4db7fc1ee909	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:49.901	2026-02-05 08:52:49.901
d81a3f4f-2ee3-4148-926d-ce970cbf0cbd	de62036e-73bf-4b5f-9a97-ed8d9a477b84	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:50.244	2026-02-05 08:52:50.244
89b7a7aa-efc8-4d73-bcf9-7d5a2dd5fc87	31293f71-db78-4e8e-a784-a709904507a5	BTC_1	2026-12-31 00:00:00	24	\N	2026-02-05 08:52:50.588	2026-02-05 08:52:50.588
e6391975-12c1-496a-95d5-1d149bf892f9	c9ab7128-4063-42f5-9c19-ebc6b7ea1714	BTC_1	2026-12-31 00:00:00	12	\N	2026-02-05 08:52:50.931	2026-02-05 08:52:50.931
e3df66c8-2134-4086-9f0c-f11f26b125d8	a475b5d0-7d00-41cd-8b02-53ba58432676	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:52:51.275	2026-02-05 09:08:40.068
b14dac8f-9ead-4bc1-9f05-cf5e4abc9c32	33a4d4fe-31bb-4678-9c7d-af1e69c78b8a	BTC_1	2026-12-31 00:00:00	6	\N	2026-02-05 08:52:44.92	2026-02-05 14:00:26.767
f6f23314-5add-4ee0-96e3-b78a186c972d	ae2fdf74-5886-4738-817d-6a24986531d8	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:41.828	2026-02-05 09:35:58.992
58db015f-05bc-489d-bb00-21fe8553c495	9d5532ca-6247-455f-9d2f-f9471f4372b7	BTC_1	2026-12-31 00:00:00	7	\N	2026-02-05 08:52:37.707	2026-02-05 14:21:27.171
df52eed5-67a5-4966-8142-fca7e2e8228b	4dd43df6-f17a-47b9-b9ae-33ca2619dcee	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 08:52:41.484	2026-02-05 09:39:11.324
56ebc88e-103a-4a74-a93f-f82cf08eb72e	180b0787-f024-4f32-83b5-2410a6a49be7	BTC_1	2026-12-31 00:00:00	6	\N	2026-02-05 08:52:45.264	2026-02-05 09:39:11.652
ea42ca91-cbd8-45be-bf2f-d377b4921924	7ea6d19f-5bab-4419-88ec-5346521b06b0	BTC_1	2026-12-31 00:00:00	12	\N	2026-02-05 08:52:47.495	2026-02-05 09:39:11.979
1ebc787c-806c-49c3-b16d-36b4298fdb34	f4860788-c8eb-44d0-ad31-cb91237ddc6e	BTC_1	2026-12-31 00:00:00	5.378	\N	2026-02-05 08:10:46.491	2026-02-05 10:02:30.855
c73e3410-3b4c-439d-8b9a-227c1e7e0363	e492a32c-8bf1-49c4-acb5-34ded825a8b5	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 08:52:44.233	2026-02-05 10:02:31.376
17e4a375-510d-4dfc-b82b-3a1e56eab98f	56ed0167-cebf-483e-83b4-d1059c8382c3	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 15:08:06.091	2026-02-05 15:10:39.718
f817e812-7707-464b-9eb5-d93223926a7e	2efe28e3-0f70-40e6-92dd-b7678b4b6979	BTC_1	2026-12-31 00:00:00	18	\N	2026-02-05 08:52:40.798	2026-02-05 14:25:25.381
d565d917-bb42-403c-9555-672adc9f3617	d6e097fb-8a28-48fd-92e2-e62e4f7aaedc	BTC_1	2026-12-31 00:00:00	20	\N	2026-02-05 09:05:43.692	2026-02-05 14:46:00.926
6b2d2da1-54da-4a52-ac18-c6a24db6c6ec	6186659c-1ced-4a40-9b19-d984c6e0f038	BTC_1	2026-12-31 00:00:00	3	\N	2026-02-05 08:52:48.183	2026-02-05 13:06:53.003
92a6f566-b06c-4659-be72-ba68c9a6b254	d605ddae-019d-4f30-b484-f9b7e7ba0180	BTC_1	2026-12-31 00:00:00	24.5	\N	2026-02-05 08:10:40.038	2026-02-05 14:58:20.555
8a1cd564-c8a3-4053-a701-7f702de095ea	7eebfb3b-6bd4-446f-864b-d5bca2191add	BTC_1	2026-03-05 00:00:00	15	\N	2026-02-05 09:32:45.749	2026-02-05 14:58:20.904
2bff8758-0a71-4ba7-8199-922053ba1691	4d08148e-1214-40fb-8bfc-8cc033070930	BTC_1	2026-12-31 00:00:00	1.4	\N	2026-02-05 08:10:46.168	2026-02-05 14:58:21.597
eb19485d-aadf-4fc4-8c2a-5468943b6a0a	8bdda71c-7e17-444e-9517-26d1a102fe97	BTC_1	2026-03-05 00:00:00	11	\N	2026-02-05 09:33:03.995	2026-02-05 14:59:44.168
dd443774-70ad-4c15-94b2-3607cdaabcf9	26b155d6-9643-4d5c-b73f-6709eecd97d8	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:11:03.421	2026-02-05 14:59:44.867
e85e38c8-0454-481a-bfc8-4cd56afcb872	66f9cfc1-d27a-4764-8063-aad5f088d8d3	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 15:08:03.859	2026-02-05 15:08:03.859
9505769e-c1ea-4b78-b360-640103790a16	6c85fc18-8514-4718-883d-49e2ba73e450	BTC_1	2026-12-31 00:00:00	11	\N	2026-02-05 08:52:47.152	2026-02-05 14:00:26.082
000ad950-7178-4a5a-99be-9e25dd2df8ff	66e73fce-0a19-4131-9a3b-8a9212e960cc	BTC_1	2026-12-31 00:00:00	17	\N	2026-02-05 08:52:47.839	2026-02-05 14:00:26.425
597102ee-8839-480a-80b7-6f4972572c12	1eb97f73-859d-40b5-8e6a-8d247d4a3bf8	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 15:08:04.378	2026-02-05 15:08:04.378
bb002518-bf86-4931-a034-50bd5d9f3b87	ffc7c896-22b7-4a88-9e04-fd37749dead0	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 15:08:04.721	2026-02-05 15:08:04.721
d6a97715-4cb3-4510-a051-397698df53c0	aeb61756-0129-4eb7-992b-c7c8f0ebf622	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 15:08:05.065	2026-02-05 15:08:05.065
7da6b883-bc4c-42ea-b75a-f7d83fffd79f	4d3da416-b404-4873-afd2-10565cc5a9dd	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 15:08:05.407	2026-02-05 15:08:05.407
55ab8345-2d20-4fb0-90c2-c633dce4d6f9	5c7eb954-3b29-466e-be8d-ee56c33e5284	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 15:08:05.75	2026-02-05 15:08:05.75
dab9c27e-19b2-4eb4-a875-3ed99f80d2ca	9f9df6fb-6264-4411-83a3-0c956417609a	BTC_1	2026-12-31 00:00:00	0.43	\N	2026-02-05 08:10:43.266	2026-02-05 14:58:19.337
e4c83ed2-b5a3-4276-b661-95f958201eb9	01d06378-50ce-4362-9afe-6eed56b27533	BTC_1	2026-12-31 00:00:00	27	\N	2026-02-05 08:10:56.326	2026-02-05 13:06:53.528
724edcbb-bf43-4f07-9849-928250bda570	6a9537be-1c06-4664-aaba-7d31b4d29674	BTC_1	2026-12-31 00:00:00	7	\N	2026-02-05 08:10:47.459	2026-02-05 08:30:56.606
157b1d98-a7fa-4ddc-b001-d350767b80d8	e37123ad-b974-41a0-aa7a-8767ea131f0f	BTC_1	2026-12-31 00:00:00	1.175	\N	2026-02-05 08:10:42.943	2026-02-05 14:58:19.858
272b5fe6-023d-4e4f-8906-b96d2283cd8a	343dac66-1911-45d3-aac9-8551a414960a	BTC_1	2026-12-31 00:00:00	0.8	\N	2026-02-05 08:10:43.588	2026-02-05 08:36:19.697
f33bb753-1827-4396-8b23-86814c125622	4d623ad0-da9d-438b-ac94-3e93cf890f8a	BTC_1	2026-12-31 00:00:00	1.84	\N	2026-02-05 08:10:44.878	2026-02-05 08:40:35.822
d9e76442-4196-4c77-82a7-1d8bb8d8ddec	24c655ee-f53d-4be1-84d3-cb079a116f84	BTC_1	2026-12-31 00:00:00	0.203	\N	2026-02-05 08:10:43.911	2026-02-05 14:03:31.937
eac61f53-3cc4-4301-a475-ecc41f055350	a113fa7a-f1dd-4f04-b57c-286330d1d2d3	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:10:39.522	2026-02-05 14:14:22.71
b0baa0a7-734b-49e6-add1-4b2c002af918	0cf260dc-dd0c-4c65-949f-38ab6311a7e2	BTC_1	2026-12-31 00:00:00	7	\N	2026-02-05 08:10:48.104	2026-02-05 14:03:32.278
4b08fde2-30e2-407b-8eda-543a17f96f20	1dc784da-c211-412a-9227-341ba89a3070	BTC_1	2026-12-31 00:00:00	0.9	\N	2026-02-05 08:10:51.651	2026-02-05 09:21:22.42
d8db02cb-1a3d-453d-8427-a40ac50e632e	926119be-1158-4cba-bac7-bb876764775e	BTC_1	2026-12-31 00:00:00	4	\N	2026-02-05 08:10:40.361	2026-02-05 14:58:20.208
b64fe070-b92f-47ea-b1a4-4e01f51cf5dd	0c6b0140-bb85-4092-8a5e-2d73c9b4898c	BTC_1	2026-12-31 00:00:00	1.15	\N	2026-02-05 08:10:45.523	2026-02-05 11:03:58.914
e3628613-b01f-451b-b769-c5d5828515c3	67e8daa2-2c84-4a32-9c91-fce50f6c1401	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:10:56.003	2026-02-05 14:03:32.619
ba4616ad-f620-4e22-9fe6-b94c4e30425f	f7eaa8e5-3e1f-41aa-9d90-1b031a47aff5	BTC_1	2026-12-31 00:00:00	2.69	\N	2026-02-05 08:10:40.684	2026-02-05 08:10:40.684
1510bc57-4431-4437-affb-15e2f198bbee	a41321c1-4731-46be-bd76-7c53d1460a16	BTC_1	2026-12-31 00:00:00	1.15	\N	2026-02-05 08:10:41.008	2026-02-05 08:10:41.008
b1cf6ace-ef78-4d48-8abe-bccd1ef6bc83	d7f46f99-4382-4372-884b-23de74b6109b	BTC_1	2026-12-31 00:00:00	0.474	\N	2026-02-05 08:10:41.33	2026-02-05 08:10:41.33
bece9359-bd92-455e-b696-132e36487cc3	947539a2-2b8f-4b2d-951e-3a8ed29e3e16	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:10:41.654	2026-02-05 08:10:41.654
66ebc4e6-9d6d-4519-8a31-6ddaab94a9f2	be05dca7-132b-4f82-aa36-633e7c483659	BTC_1	2026-12-31 00:00:00	1.04	\N	2026-02-05 08:10:41.976	2026-02-05 08:10:41.976
315346bf-efa1-4d58-991e-f577531cc584	cb442383-7b8b-4861-9105-5962581707c4	BTC_1	2026-12-31 00:00:00	1.67	\N	2026-02-05 08:10:42.299	2026-02-05 08:10:42.299
ff7671c9-7853-49d6-92a2-61ed290b61ee	6e15e739-f797-4ddd-82f1-47f0f42d29ae	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:10:42.621	2026-02-05 08:10:42.621
f384d877-e360-48f6-8532-052eb1716ce2	cabba431-59ee-458b-aa70-d7102cc95f3b	BTC_1	2026-12-31 00:00:00	0.458	\N	2026-02-05 08:10:44.234	2026-02-05 08:10:44.234
a51f7810-25b6-4f8d-893b-feb74c10ad63	aba19b15-8355-44c0-8b12-b4752a2e5466	BTC_1	2026-12-31 00:00:00	0.168	\N	2026-02-05 08:10:44.556	2026-02-05 08:10:44.556
950f3a82-a723-4b83-bd70-063a728a9b16	87b0f38b-720b-4591-9ad2-c1cdd7180ca6	BTC_1	2026-12-31 00:00:00	1.65	\N	2026-02-05 08:10:45.201	2026-02-05 08:10:45.201
5d78a08d-73f5-46d0-88ed-d3561689a35e	a056bcc0-a3d8-4a73-abff-fdc2ba0b6542	BTC_1	2026-12-31 00:00:00	0.23	\N	2026-02-05 08:10:45.846	2026-02-05 08:10:45.846
684f97d4-b852-49cd-8412-78d40393c4b9	47988dda-1895-4138-9722-a17ecf455070	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:46.814	2026-02-05 08:10:46.814
9ff9ee88-6bea-456d-8b26-8901dbc8b837	eabcab97-b73f-4c23-94ee-e390dd23b09b	BTC_1	2026-12-31 00:00:00	8	\N	2026-02-05 08:10:47.136	2026-02-05 08:10:47.136
59c43a13-b4c4-47eb-85eb-648880cde002	f3794610-763e-48c1-8d98-f5f73a71169d	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:10:47.781	2026-02-05 08:10:47.781
72be3fc9-7c27-4cfc-aef4-d832c0330cb7	4864cf04-fefc-47ff-a812-bc3b4a94bc32	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:10:48.426	2026-02-05 08:10:48.426
b4f647f9-5c00-4039-9e83-a40ba587f268	e3415b27-2d1b-4f9b-b408-c9a2b8007f74	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:48.748	2026-02-05 08:10:48.748
82364c27-45b0-414f-b7f4-d411db27c889	4097c2fe-746c-4599-95e2-4080e492e6c7	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:49.07	2026-02-05 08:10:49.07
e0aa364f-2d9d-4abb-909a-c5429bf9b86f	1f4cde06-d849-4356-b650-d6bd689baa7a	BTC_1	2026-12-31 00:00:00	16	\N	2026-02-05 08:10:49.716	2026-02-05 08:10:49.716
60862006-5aaa-46c3-ae41-a47fa2f48707	f80d5c52-c2b8-4647-b33a-c95dbc5ede23	BTC_1	2026-12-31 00:00:00	8	\N	2026-02-05 08:10:50.038	2026-02-05 08:10:50.038
d8cf8c13-9db3-485a-ada0-3b167cde7e88	5b7f1117-a941-40e4-b4ff-62d96b946001	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:10:50.683	2026-02-05 08:10:50.683
b910adbf-9e7a-4b6c-aeef-b1bf31ab1c0c	c3ce73e3-57a2-4d5f-995e-7a5ba9ea198e	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:10:51.006	2026-02-05 08:10:51.006
44273651-3c58-4edb-8d7b-f1a5bc3f84a5	11a42c2f-b413-4a80-8d37-971a88dfbe6f	BTC_1	2026-12-31 00:00:00	0.5	\N	2026-02-05 08:10:51.329	2026-02-05 08:10:51.329
6d2c2dae-cd6a-433e-acaf-435024715245	4dcfefb0-57f7-4ca3-8e8c-50a59906079b	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:10:51.974	2026-02-05 08:10:51.974
a94a820b-92e9-4425-80c3-18f1c09c6ce1	0ea0e8ad-c601-421e-b0b9-fe4fd7169272	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:10:52.296	2026-02-05 08:10:52.296
f3cc0ff9-cf8c-4464-b465-d8775d5310cd	237ad48a-60a9-40b0-8f9d-fceff154f31a	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:10:52.619	2026-02-05 08:10:52.619
24a4852a-22f8-49d8-b343-4246487d2591	6fe0d303-fc0b-4195-a776-9f59f0fa1262	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:10:52.941	2026-02-05 08:10:52.941
f003a8d9-1764-40d3-a867-e3b3edf83139	bbe2aed1-0801-48c6-8eff-4b489a801ab3	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:10:53.263	2026-02-05 08:10:53.263
414f208f-f06d-49b5-8878-5f13a91321e1	c614ec30-f181-476c-8a43-1a5cb5b3780e	BTC_1	2026-12-31 00:00:00	4	\N	2026-02-05 08:10:53.585	2026-02-05 08:10:53.585
220ab332-421f-4376-bace-4b687b1132fe	a85883cf-7914-4e7d-88de-d5a8c3b4893d	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:10:53.908	2026-02-05 08:10:53.908
49ff115f-ae27-4eaa-98f5-3ca876424d40	0db97b8a-dab4-4b79-8260-f090a5d26868	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:10:54.39	2026-02-05 08:10:54.39
89114653-f543-4fca-af50-b16ed5357345	3ee4b9ed-94ee-4734-bfa4-9cc5a6a2c5e0	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:54.713	2026-02-05 08:10:54.713
9aa3438f-0cbf-40a2-b6d2-5363cbee2f7a	736fc8df-7fc9-4074-85ba-6e7037503793	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:10:55.036	2026-02-05 08:10:55.036
8640631e-7ae3-4f00-bcfa-e3a343de541b	97180d57-1c48-45fa-8ed1-45e7d9a8271d	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:55.358	2026-02-05 08:10:55.358
d24bf31d-7797-4a28-af5b-031bf3dd11c9	d213f4cb-05e7-4288-b21e-fb941e19fe80	BTC_1	2026-12-31 00:00:00	30	\N	2026-02-05 08:10:55.681	2026-02-05 08:10:55.681
409599fa-c54d-4a55-8da0-e8b951599f68	8ecfb363-f475-4d12-b01e-e22e5729301f	BTC_1	2026-12-31 00:00:00	20	\N	2026-02-05 08:10:56.649	2026-02-05 08:10:56.649
a7dabc46-a10a-473e-be8d-077ee7eeacc9	63d0c890-1536-456b-81a1-ca3b0d2bf358	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:56.971	2026-02-05 08:10:56.971
5db8677a-ad7f-495c-a754-7ec69a73812b	0ccd1ea3-55a5-4e56-8bbd-0adfae15b6a8	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:57.293	2026-02-05 08:10:57.293
d19f369f-78f0-499c-86f0-376eed95d58d	6b0d953c-1f91-4097-8cdf-7d12b344c890	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:10:57.615	2026-02-05 08:10:57.615
5c3ffa41-e933-4d51-a261-c17ec112ddf6	68381dc3-10aa-49ab-9e2c-8fb6659ca05e	BTC_1	2026-12-31 00:00:00	6	\N	2026-02-05 08:10:57.938	2026-02-05 08:10:57.938
01a3f0f9-1369-4145-bda9-fdace0713fa2	cae5d0df-9937-4f27-9e1d-fabe5e931826	BTC_1	2026-12-31 00:00:00	15	\N	2026-02-05 08:10:58.584	2026-02-05 08:10:58.584
e51cf646-cebc-4777-966c-0c97dde5c027	47330d1e-196e-44f0-becb-b00cab24aa32	BTC_1	2026-12-31 00:00:00	13	\N	2026-02-05 08:10:58.906	2026-02-05 08:10:58.906
9418167d-f1fc-4848-8854-2c7b554fd20b	d83293a9-a19c-4018-9e5b-422eb6566fea	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:11:00.519	2026-02-05 08:11:00.519
2dff473e-9006-49a4-b086-fd76af2d8cd9	cf370f63-f2c4-481c-94be-bb32eb2c4c6c	BTC_1	2026-12-31 00:00:00	18	\N	2026-02-05 08:11:00.842	2026-02-05 08:11:00.842
9d89f717-2e57-4d8e-ba22-751011d76a3a	07f34f49-fafd-4eb1-97b5-9505ed36e5b0	BTC_1	2026-12-31 00:00:00	20	\N	2026-02-05 08:11:01.164	2026-02-05 08:11:01.164
619c3151-c0f8-4c90-89b2-d4db87fb892f	1a82dd56-03fa-4f30-9ca5-108d003f488c	BTC_1	2026-12-31 00:00:00	0	\N	2026-02-05 08:11:01.486	2026-02-05 08:11:01.486
198349d4-7b8b-43d0-af4e-da4ffc7ccbf0	228d839a-1ab6-4f06-b2e6-adbef9f81e7d	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 08:11:01.808	2026-02-05 08:11:01.808
28996318-5618-42da-8e0f-1395c5d33c07	0608feb6-92b8-4833-a2c5-527ee1cdb114	BTC_1	2026-12-31 00:00:00	0	\N	2026-02-05 08:11:02.454	2026-02-05 08:11:02.454
89c38350-4108-40cf-a194-eeb3e0b729e2	4a7edf58-6a68-46be-a63e-7822f9bfaf6f	BTC_1	2026-12-31 00:00:00	3	\N	2026-02-05 08:11:02.776	2026-02-05 08:11:02.776
e58a8c53-aef6-49f8-86e0-de6a1bb2ba13	983a9079-b72b-4955-ad79-8cdc5e654fda	BTC_1	2026-12-31 00:00:00	0	\N	2026-02-05 08:11:03.743	2026-02-05 08:11:03.743
e8829b49-1760-4600-8c47-78f62a8d1e6b	2832bd62-7b05-4f03-99ba-96af3c271df0	BTC_1	2026-12-31 00:00:00	0	\N	2026-02-05 08:11:04.065	2026-02-05 08:11:04.065
92ff91ab-b80a-44d1-8296-eebbaedc48da	21b2da05-ae8a-456c-bdcc-b4d6df6439cd	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:11:06.451	2026-02-05 08:11:06.451
bba5ebf8-ace2-4c26-be7d-0dca8ebc36ee	4bc5d2c5-ca2d-44ef-ae86-9c8f966aa6d4	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:11:06.79	2026-02-05 08:11:06.79
c09256fb-1161-446c-a32a-b9e494481fd8	1f42441f-cea4-49b0-ad02-ab8f290afbb7	BTC_1	2026-12-31 00:00:00	1.1	\N	2026-02-05 08:11:07.129	2026-02-05 08:11:07.129
70de4a73-8af7-4301-a0e3-a781ce11baba	ed9ef888-a6c7-48b2-b4fc-f6fd3a2699d0	BTC_1	2026-12-31 00:00:00	32	\N	2026-02-05 08:52:39.768	2026-02-05 08:52:39.768
29f00e6f-9752-4fdd-b583-c13a733e253c	97128cbb-b1d0-4476-baf4-39310713228d	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 08:11:06.111	2026-02-05 08:29:25.608
f6abecfc-9582-45ba-855b-21a2baeac4ff	b76c47dd-9b43-4fb4-b029-ed292564a91d	BTC_1	2026-12-31 00:00:00	30	\N	2026-02-05 08:10:58.26	2026-02-05 14:00:24.54
331d7c10-6ad9-4936-993d-b98ff592b4d1	4dd1a7c2-d58a-4864-945e-8d1c3f14ee42	BTC_1	2026-12-31 00:00:00	3	\N	2026-02-05 08:52:37.02	2026-02-05 09:24:00.658
dbeb1fc2-a8cb-4062-bd36-680e0d1182ed	1f9b0b86-4afb-411f-9cd7-f4f16b9f20c5	BTC_1	2026-12-31 00:00:00	119	\N	2026-02-05 08:52:40.111	2026-02-05 14:15:28.091
7eedda9a-dd66-4204-a0b1-39ae89c067dd	ea203e57-af8b-49c7-a8c7-92e486b2dc75	BTC_1	2026-12-31 00:00:00	3	\N	2026-02-05 08:52:33.584	2026-02-05 14:03:31.082
2b242c11-db47-4d89-9b7e-0c6e48ed8137	bc6d2664-3b1f-4183-a2cf-06a6bcdf6deb	BTC_1	2026-12-31 00:00:00	2.5	\N	2026-02-05 08:52:32.554	2026-02-05 08:52:32.554
312b28cf-f765-46a1-8d6e-4af52a1e873c	29b345f9-610b-4eb7-b624-7441e4f1a383	BTC_1	2026-12-31 00:00:00	2.5	\N	2026-02-05 08:52:32.898	2026-02-05 08:52:32.898
a10c61a4-c0c7-482b-b534-943ee7553281	2e039eaf-5a8e-43d4-823c-34d500528755	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:52:34.27	2026-02-05 08:52:34.27
91d4e887-ccb1-4c86-bdb9-64709d9ce949	d881de69-a3ba-43b7-bd17-4edec37a813a	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:34.614	2026-02-05 08:52:34.614
dcf11cd9-aa3e-4c63-a59b-93702a218c8a	ec6988db-7785-45a3-adca-dd23067228b8	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:52:34.959	2026-02-05 08:52:34.959
3e312af0-c687-49f6-bff3-dcf776431b75	afeeca32-7810-4d4e-8340-49ff94c576a8	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:52:35.302	2026-02-05 08:52:35.302
9961e031-7df9-4910-b4db-467cf78e5417	22eff87a-e2d5-4bc3-90c3-2228b71f0f4e	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:52:36.332	2026-02-05 08:52:36.332
c8f6c149-ea41-4a91-a555-22b860ff5b47	9eeabb18-9aa2-45bb-a22c-29ecbbf5920c	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:37.363	2026-02-05 08:52:37.363
6375d4a6-eeb8-45fe-b9bc-03a10fd51b9c	02d26107-641b-472e-a7ac-32c2af94e1fe	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:52:38.05	2026-02-05 08:52:38.05
3cfe614d-8162-47bc-94ff-8beb1d2a0dcc	7dec121a-1c69-49a5-9b50-7c33d5a7aae7	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:52:42.171	2026-02-05 08:52:42.171
aa56fc58-a538-45e5-b8ef-1b1e847477a8	de35248a-6562-494e-9fc1-af533f16c319	BTC_1	2026-12-31 00:00:00	7	\N	2026-02-05 08:52:42.515	2026-02-05 08:52:42.515
7c43d017-0ac3-4d16-8266-784a64d4008a	19af4dc6-61ef-4e8f-9201-7510b3eb1c2d	BTC_1	2026-12-31 00:00:00	6	\N	2026-02-05 08:52:42.858	2026-02-05 08:52:42.858
2196cbc5-237d-429f-85c7-9c3827de259e	fc5c2529-fbd8-4fe9-8166-cee2b87197d1	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:52:43.201	2026-02-05 08:52:43.201
5138622a-d374-44c2-abe8-42653cbd0fe8	5550b090-8293-4e34-ada6-3b916af3ba51	BTC_1	2026-12-31 00:00:00	10	\N	2026-02-05 08:52:43.546	2026-02-05 08:52:43.546
4af22645-4170-4655-80e5-13ac90718ea0	f42f4989-6901-4593-af7a-a2a84b4db5e2	BTC_1	2026-12-31 00:00:00	25	\N	2026-02-05 08:10:59.874	2026-02-05 11:05:12.536
da32685b-37d5-4273-be5b-8e4c5b9abca2	f19638bb-61b1-4b78-a135-a8b3f4d90f47	BTC_1	2026-12-31 00:00:00	81	\N	2026-02-05 08:10:59.551	2026-02-05 14:59:43.298
ddd54572-5c52-4961-b1b3-8c26b6598bf3	b555cc65-c8a9-481f-88ca-d33245728e96	BTC_1	2026-12-31 00:00:00	0	\N	2026-02-05 08:52:38.394	2026-02-05 14:21:26.679
4c7d8dde-c9de-4292-a9e5-8f1e12e4d0d2	2e57bf68-514b-462a-b407-1c6b43630053	BTC_1	2026-12-31 00:00:00	2	\N	2026-02-05 08:52:32.038	2026-02-05 09:24:01.167
f6f8f510-1819-480c-85e3-c3bead284518	c3b3a3f1-af77-4d79-ba00-8fa9c3ea2895	BTC_1	2026-12-31 00:00:00	4	\N	2026-02-05 08:52:35.645	2026-02-05 14:03:31.596
123dbb3a-6470-4b86-a0f2-b9352374c7dc	435dd281-e5f2-4710-b106-ec539bd08d68	BTC_1	2026-12-31 00:00:00	19	\N	2026-02-05 08:10:59.228	2026-02-05 15:11:34.473
3caa3a42-1f05-4c81-8cb8-2f3aa6b43258	7e8bc9f2-92a9-4c9c-bcb5-45d7f0e949ac	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:52:38.737	2026-02-05 09:34:38.572
4a7833d6-4e68-4a9d-b759-839ab8c839a8	c4467da5-76dc-410f-9ce1-9743b5082ba7	BTC_1	2026-12-31 00:00:00	7	\N	2026-02-05 08:52:35.988	2026-02-05 10:08:26.695
9071e79c-d403-4003-afd5-a2707ffe695e	0ffdfeb1-d65b-4b98-ad70-2f806feda001	BTC_1	2026-12-31 00:00:00	4	\N	2026-02-05 08:52:39.423	2026-02-05 13:19:59.783
eeb9deb3-fd0d-478d-a0fe-0c346d846cce	8fc26424-df23-421c-8c1d-a69da40b2fe9	BTC_1	2026-12-31 00:00:00	3	\N	2026-02-05 08:11:00.197	2026-02-05 10:25:40.663
47f6d277-d1de-4db3-a7ee-ac25e39e0cdb	04e0026b-f453-448e-8093-6613aa1ecf77	BTC_1	2026-12-31 00:00:00	0	\N	2026-02-05 08:11:05.6	2026-02-05 11:54:28.793
085432b3-b850-4e76-a6cc-20c653ea70f3	114643b7-272f-4ae7-b5af-893680757c9d	BTC_1	2026-12-31 00:00:00	9	\N	2026-02-05 08:52:33.927	2026-02-05 12:51:36.954
0a0bd88f-3730-47e6-8cb2-dedfe04853e2	e4ab569e-c068-4280-affc-14a1b2626bd0	BTC_1	2026-12-31 00:00:00	17	\N	2026-02-05 08:52:41.141	2026-02-05 14:25:25.906
a337f510-697c-4251-a288-691296832412	910349e2-d4ca-4079-a749-d7ee89eb5de5	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:52:39.08	2026-02-05 11:29:00.147
5431a389-d08c-4d8c-9c88-f33eb9db7371	80c0a9d3-e844-4fbd-b0e9-beebfb1078f0	BTC_1	2026-12-31 00:00:00	132	\N	2026-02-05 08:52:40.454	2026-02-05 14:58:21.251
f53d05e6-85c2-421c-aedd-b486d77fde31	8582a0bd-84ba-4a27-a808-c9acc493eb04	BTC_1	2026-12-31 00:00:00	3.75	\N	2026-02-05 08:52:33.241	2026-02-05 12:51:37.837
766bc1cc-2174-4226-b0e7-00271545a543	da5819dc-a344-486a-887f-abadbe246ca8	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:52:36.676	2026-02-05 14:00:25.74
cf0e8b33-489f-4108-924e-aa1f48093689	878a443c-7a3c-4cb0-bd98-cc9c03d05c19	BTC_1	2026-12-31 00:00:00	1	\N	2026-02-05 08:11:02.131	2026-02-05 14:59:43.82
569aa2bf-891a-4d33-883b-37473c68705b	f660f568-e2d3-4662-88db-f1645d260fad	BTC_1	2026-12-31 00:00:00	5	\N	2026-02-05 08:11:03.099	2026-02-05 14:59:44.519
\.


--
-- Data for Name: Purchase; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Purchase" (id, "supermarketId", "supplierId", "invoiceNumber", "totalAmount", status, date) FROM stdin;
\.


--
-- Data for Name: PurchaseItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PurchaseItem" (id, "purchaseId", "productId", quantity, "costPrice", "taxAmount", total) FROM stdin;
\.


--
-- Data for Name: Sale; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Sale" (id, "supermarketId", "invoiceNumber", "cashierId", date, "subTotal", "taxTotal", discount, "totalAmount", "paymentMode", "customerId", "originalPaymentMode") FROM stdin;
8554f6b5-241b-4f44-a14d-c35a0e830e0d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280015102	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:26:55.103	281.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	281.000000000000000000000000000000	UPI	\N	\N
0c20a98b-df64-4727-9ab6-b569e83ba16e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280163738	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:29:23.739	105.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	105.000000000000000000000000000000	UPI	\N	\N
23da9de2-c628-4f8e-9244-d1f0224a1a67	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280222133	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:30:22.134	40.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000	UPI	\N	\N
2276783c-95e9-4434-ad61-7bd1db67d1f0	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280255069	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:30:55.07	103.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	103.000000000000000000000000000000	CASH	\N	\N
40c1bc75-8456-4519-864f-7af4e55090ea	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280319403	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:31:59.405	45.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000	UPI	\N	\N
07b7c210-49a2-4c9d-9915-f9b8a7a8b9cf	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280506596	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:35:06.597	129.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	129.000000000000000000000000000000	UPI	\N	\N
63ebfba2-d1ba-4d4f-8112-49461d17f9a9	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280577837	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:36:17.838	69.760000000000010000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	69.760000000000010000000000000000	UPI	\N	\N
5a9beac2-47d4-49c1-a0fd-d60445998a0a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770280833955	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:40:33.956	96.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	96.000000000000000000000000000000	UPI	\N	\N
79c5a542-cd05-40ed-8e51-7f5c17c630de	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770281124005	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 08:45:24.006	276.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	276.000000000000000000000000000000	UPI	\N	\N
9616175a-367b-47f4-ae74-38c73b6f5bbc	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770282419652	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:06:59.654	57.050000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	57.050000000000000000000000000000	UPI	\N	\N
3dff8aa1-d454-4d1b-bf14-b2acb187cea6	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770282468229	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:07:48.23	56.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	56.000000000000000000000000000000	CASH	\N	\N
1f3d4814-4cb3-467b-bd40-9730f1535f94	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770282518131	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:08:38.132	50.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000	UPI	\N	\N
58405f8d-52c6-4695-9d80-2495c2acffe7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770282629839	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:10:29.84	45.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000	CREDIT	dd48f08b-89e2-4f13-bbbd-150a5643431e	\N
05945b63-3035-4fd8-a853-241e41359726	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770282723881	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:12:03.882	135.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	135.000000000000000000000000000000	CASH	\N	\N
4e78f266-17f4-4846-9fdd-f3a8642564dd	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770283177297	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:19:37.298	10.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000	CASH	\N	\N
98b00e3d-6ad1-4d7d-a77f-dfaa573ecb37	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770283280175	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:21:20.176	69.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	69.000000000000000000000000000000	CREDIT	e64c37a6-de24-4d47-a4d3-fa52073fc026	\N
10ed29f2-2f3d-4163-b335-ea0a7038588c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770283439302	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:23:59.304	178.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	178.000000000000000000000000000000	CASH	\N	\N
2c5d9396-5e0a-433e-80a7-730e65047fce	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284045051	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:34:05.052	65.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	65.000000000000000000000000000000	CASH	\N	\N
3ab57084-028f-4031-ab2a-bb22f1ad785e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284077597	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:34:37.598	30.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	30.000000000000000000000000000000	CASH	\N	\N
0a1144e8-f468-49ac-a4e1-1c5123ea0e63	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284118362	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:35:18.363	56.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	56.000000000000000000000000000000	UPI	\N	\N
31a7e56b-5ff1-48ef-81fc-a5e405dda1ed	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284158177	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:35:58.178	55.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	55.000000000000000000000000000000	UPI	\N	\N
72d44bab-8eb1-44a4-a0f7-e1c2a74e28c2	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284187769	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:36:27.77	40.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000	UPI	\N	\N
e2fd05ef-5842-4160-bac7-8a58de0edf14	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284226792	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:37:06.793	25.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000	CASH	\N	\N
5319d2ba-b457-419b-a528-7d9a77e6a9ff	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284265674	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:37:45.675	77.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	77.000000000000000000000000000000	UPI	\N	\N
219ff6b2-52d8-4d7c-9951-e1bd5853b1d2	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770284350506	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 09:39:10.507	155.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	155.000000000000000000000000000000	UPI	\N	\N
9c1edb53-2fbc-4d3a-9720-f4d99e6171e3	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770285749465	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 10:02:29.467	140.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	140.000000000000000000000000000000	CASH	\N	\N
7fb32710-49cf-4f0c-9831-f1fc918f93fc	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770286699078	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 10:18:19.079	40.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000	UPI	\N	\N
83c8ba3f-79d8-4042-938a-4c9ccdcb8896	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770287139254	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 10:25:39.255	10.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000	UPI	\N	\N
d9a0c960-fab4-4dba-8f10-d546e8b3ba84	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770287549759	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 10:32:29.761	192.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	192.000000000000000000000000000000	CASH	\N	\N
7fe2ccae-26fd-41ad-b9c4-2e9343294f3f	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770287565845	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 10:32:45.847	50.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000	UPI	\N	\N
1e5d6967-830a-4d36-b8e2-2a6d34709202	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770287778735	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 10:36:18.736	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CREDIT	e64c37a6-de24-4d47-a4d3-fa52073fc026	\N
f1a19dff-52dc-4d3e-af33-d3605584aae1	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770288329206	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 10:45:29.208	10.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000	CASH	\N	\N
a79447f0-b14c-4afb-ba06-eb8733ed7793	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770289437014	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 11:03:57.015	70.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	70.000000000000000000000000000000	CASH	\N	\N
e977e9c0-af52-460f-ba53-569bfb22c350	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770289511130	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 11:05:11.131	35.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	35.000000000000000000000000000000	CASH	\N	\N
71fbff4a-22c6-4eb2-8992-aa59ccb40692	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770290570740	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 11:22:50.742	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CASH	\N	\N
1774e418-bb7c-4be1-8b3c-c2c5b41f4fa7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770290938233	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 11:28:58.234	43.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	43.000000000000000000000000000000	CASH	\N	\N
f99bae49-289b-43dc-b41f-25571296997c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770292128502	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 11:48:48.503	40.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000	CASH	\N	\N
e8960483-3011-4b70-b878-1ea1d6ea8340	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770292467374	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 11:54:27.376	114.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	114.000000000000000000000000000000	UPI	\N	\N
d02b708e-ee87-4cd4-a18a-37edc995fdc7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770293909682	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 12:18:29.683	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CASH	\N	\N
7a0536ed-3dab-4aa9-97e7-52e07bf51090	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770294552807	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 12:29:12.808	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CASH	\N	\N
9cb4bbca-04a3-435e-b52c-bb54b6e9206a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770295895537	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 12:51:35.539	224.500000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	224.500000000000000000000000000000	UPI	\N	\N
9d6fe8d8-3272-4826-a813-693dd5e1081a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770296496823	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:01:36.824	25.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000	CASH	\N	\N
a4c0d966-8e35-4c40-be59-c6faab6a2bd5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770296537560	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:02:17.561	28.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000	CASH	\N	\N
e0be237e-54a3-4dd9-bab1-283e3f0f0788	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770296811603	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:06:51.604	228.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	228.000000000000000000000000000000	CASH	\N	\N
4207a86d-f10e-483d-b849-f753aeb2958a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770296825657	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:07:05.658	50.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000	CASH	\N	\N
266698b8-363e-454f-98bc-36b57d60c05d	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770297596668	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:19:56.669	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CASH	\N	\N
c808d5bb-98c9-436e-b113-c96be2cb3718	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770297599083	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:19:59.084	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CASH	\N	\N
8aab329a-9063-40d6-affb-eaf40c1f1d70	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770298223773	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:30:23.774	28.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000	UPI	\N	\N
f257d825-3ebd-4ad4-a15d-f6f145caa26c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770299090713	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 13:44:50.714	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CASH	\N	\N
2f492282-031c-45e9-9c40-b3bee9c56779	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770300023166	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:00:23.167	563.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	563.000000000000000000000000000000	UPI	\N	\N
ee76e276-7ede-4847-8d16-68ca831e4cad	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770300209696	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:03:29.697	224.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	224.000000000000000000000000000000	UPI	\N	\N
16bd78ed-83bf-4048-a09d-b39d08ea3b53	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770300860899	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:14:20.901	132.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	132.000000000000000000000000000000	UPI	\N	\N
1ba54f19-b591-4783-86fc-5b9f74bf4a2e	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770300926738	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:15:26.74	5.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	5.000000000000000000000000000000	CASH	\N	\N
772483bc-f401-4fdc-9326-940f12de552c	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770301285364	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:21:25.365	35.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	35.000000000000000000000000000000	CASH	\N	\N
68f4e561-afc8-4280-8f60-e7d6ac4b22cd	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770301523979	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:25:23.98	50.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000	UPI	\N	\N
bb67d15c-6a23-48ca-af37-56ac6274af61	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770302739566	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:45:39.567	20.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000	CASH	\N	\N
93d06eff-0bea-4413-970c-d984ea5550cf	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770302760217	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:46:00.218	25.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000	UPI	\N	\N
2b5d5578-f699-4fe9-be3c-597b8ee56743	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770303497951	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:58:17.953	174.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	174.000000000000000000000000000000	CREDIT	b949d4bd-fef5-49b6-85b2-9ad348662a19	\N
7da671f4-5c41-47eb-b60a-5f51491955f5	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770303581907	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 14:59:41.909	275.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	275.000000000000000000000000000000	CREDIT	b949d4bd-fef5-49b6-85b2-9ad348662a19	\N
41c795e5-d656-4dee-a3ca-e18a65305d7a	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770304238244	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 15:10:38.247	25.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000	UPI	\N	\N
8b14821a-6a38-48b0-bd0f-900c99b7d1f7	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	INV-1770304293077	91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	2026-02-05 15:11:33.079	28.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000	CREDIT	f5672570-85c8-48eb-9499-fca42d3e4d8e	\N
\.


--
-- Data for Name: SaleItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SaleItem" (id, "saleId", "productId", quantity, "unitPrice", "taxAmount", total) FROM stdin;
5bbedc44-b305-41d0-8fd0-2fb9efa50ab5	2f492282-031c-45e9-9c40-b3bee9c56779	b76c47dd-9b43-4fb4-b029-ed292564a91d	1	48.000000000000000000000000000000	0.000000000000000000000000000000	48.000000000000000000000000000000
3c9772ea-d764-4c7d-b7dc-d1f0d555fdc1	2f492282-031c-45e9-9c40-b3bee9c56779	878a443c-7a3c-4cb0-bd98-cc9c03d05c19	1	45.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000
9623dde0-4c72-4391-b763-6dbd4a9b8a98	2f492282-031c-45e9-9c40-b3bee9c56779	8bdda71c-7e17-444e-9517-26d1a102fe97	1	30.000000000000000000000000000000	0.000000000000000000000000000000	30.000000000000000000000000000000
52d58aab-3dbc-47fd-b837-70549569ca20	2f492282-031c-45e9-9c40-b3bee9c56779	da5819dc-a344-486a-887f-abadbe246ca8	1	240.000000000000000000000000000000	0.000000000000000000000000000000	240.000000000000000000000000000000
109d53e3-77ec-49be-a19e-702208add1db	2f492282-031c-45e9-9c40-b3bee9c56779	6c85fc18-8514-4718-883d-49e2ba73e450	1	50.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
9bdb5080-f3df-4b6a-b795-0aeb58f061a3	2f492282-031c-45e9-9c40-b3bee9c56779	66e73fce-0a19-4131-9a3b-8a9212e960cc	3	30.000000000000000000000000000000	0.000000000000000000000000000000	90.000000000000000000000000000000
b6d311b9-af58-4cad-b05e-68364ddaab74	2f492282-031c-45e9-9c40-b3bee9c56779	33a4d4fe-31bb-4678-9c7d-af1e69c78b8a	2	25.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
46d92cc2-8143-4f45-a4f2-e0325e15309c	2f492282-031c-45e9-9c40-b3bee9c56779	2efe28e3-0f70-40e6-92dd-b7678b4b6979	2	5.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
2baa6592-2fde-4940-86be-3c6f5b4b1f26	1ba54f19-b591-4783-86fc-5b9f74bf4a2e	1f9b0b86-4afb-411f-9cd7-f4f16b9f20c5	1	5.000000000000000000000000000000	0.000000000000000000000000000000	5.000000000000000000000000000000
c0a47551-c9c5-4ddd-b620-a8f15239c21d	bb67d15c-6a23-48ca-af37-56ac6274af61	80c0a9d3-e844-4fbd-b0e9-beebfb1078f0	4	5.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
bbd33727-ee75-4572-bfc6-965e76d98e11	93d06eff-0bea-4413-970c-d984ea5550cf	d6e097fb-8a28-48fd-92e2-e62e4f7aaedc	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
d5a84664-ce9c-4ed7-93fa-0a99487a8b50	41c795e5-d656-4dee-a3ca-e18a65305d7a	56ed0167-cebf-483e-83b4-d1059c8382c3	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
1acbf8dd-1fe5-4d31-8442-5504cdda0bae	8554f6b5-241b-4f44-a14d-c35a0e830e0d	7fe19433-7dfb-4232-8906-08c453642089	1	80.000000000000000000000000000000	0.000000000000000000000000000000	80.000000000000000000000000000000
04a4eec0-c158-4723-8439-4be9516365dc	8554f6b5-241b-4f44-a14d-c35a0e830e0d	435dd281-e5f2-4710-b106-ec539bd08d68	1	28.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000
4b070cff-7fac-4924-afb7-ed372ecd9bca	8554f6b5-241b-4f44-a14d-c35a0e830e0d	d83c09ce-7d31-4abc-be77-af125cee6d03	1	133.000000000000000000000000000000	0.000000000000000000000000000000	133.000000000000000000000000000000
2c242914-3602-4c8a-ac9e-c1fc6a93f40c	8554f6b5-241b-4f44-a14d-c35a0e830e0d	f4860788-c8eb-44d0-ad31-cb91237ddc6e	0.5	80.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
ffe09ffc-ad51-4f1e-9580-f84f7106955f	0c20a98b-df64-4727-9ab6-b569e83ba16e	f19638bb-61b1-4b78-a135-a8b3f4d90f47	10	7.000000000000000000000000000000	0.000000000000000000000000000000	70.000000000000000000000000000000
4c1ec3a5-4e9f-472a-a14c-f41a6d9baa09	0c20a98b-df64-4727-9ab6-b569e83ba16e	97128cbb-b1d0-4476-baf4-39310713228d	1	35.000000000000000000000000000000	0.000000000000000000000000000000	35.000000000000000000000000000000
90be4d48-491d-408d-9c77-03ee4b8d16cc	23da9de2-c628-4f8e-9244-d1f0224a1a67	f4860788-c8eb-44d0-ad31-cb91237ddc6e	0.5	80.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
afda3a8c-6b5e-4801-ae2c-c94a50cee561	2276783c-95e9-4434-ad61-7bd1db67d1f0	a113fa7a-f1dd-4f04-b57c-286330d1d2d3	1	29.000000000000000000000000000000	0.000000000000000000000000000000	29.000000000000000000000000000000
cce7d48d-1b22-4ba7-8314-ae237249426e	2276783c-95e9-4434-ad61-7bd1db67d1f0	926119be-1158-4cba-bac7-bb876764775e	1	24.000000000000000000000000000000	0.000000000000000000000000000000	24.000000000000000000000000000000
2cb5173f-2b9a-42ab-813e-1f3d25793c2a	2276783c-95e9-4434-ad61-7bd1db67d1f0	6a9537be-1c06-4664-aaba-7d31b4d29674	1	50.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
ae5f7c3e-a4b8-4e88-aa96-189e6e41ef68	40c1bc75-8456-4519-864f-7af4e55090ea	878a443c-7a3c-4cb0-bd98-cc9c03d05c19	1	45.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000
44010241-e702-459c-a89d-b57551f09a4d	07b7c210-49a2-4c9d-9915-f9b8a7a8b9cf	435dd281-e5f2-4710-b106-ec539bd08d68	3	28.000000000000000000000000000000	0.000000000000000000000000000000	84.000000000000000000000000000000
f3faa706-83d6-4207-b60f-9c384d860783	07b7c210-49a2-4c9d-9915-f9b8a7a8b9cf	4d08148e-1214-40fb-8bfc-8cc033070930	1	45.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000
835d3d33-3005-4021-a40f-2b997d61d533	63ebfba2-d1ba-4d4f-8112-49461d17f9a9	e37123ad-b974-41a0-aa7a-8767ea131f0f	0.1	200.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
fb2faab1-be8f-4c67-b531-a976e550ef8a	63ebfba2-d1ba-4d4f-8112-49461d17f9a9	343dac66-1911-45d3-aac9-8551a414960a	0.1	80.000000000000000000000000000000	0.000000000000000000000000000000	8.000000000000000000000000000000
0cfa3929-5100-4536-965e-57976ded61fd	63ebfba2-d1ba-4d4f-8112-49461d17f9a9	f4860788-c8eb-44d0-ad31-cb91237ddc6e	0.522	80.000000000000000000000000000000	0.000000000000000000000000000000	41.760000000000010000000000000000
1b6335b1-cc89-4689-844c-bd535479d10e	5a9beac2-47d4-49c1-a0fd-d60445998a0a	435dd281-e5f2-4710-b106-ec539bd08d68	3	28.000000000000000000000000000000	0.000000000000000000000000000000	84.000000000000000000000000000000
72e860ae-d8f6-4f2e-a6e5-bc13c2f36229	5a9beac2-47d4-49c1-a0fd-d60445998a0a	4d623ad0-da9d-438b-ac94-3e93cf890f8a	0.4	30.000000000000000000000000000000	0.000000000000000000000000000000	12.000000000000000000000000000000
0239af67-f9d2-4dfd-8c30-41c14cdc6176	79c5a542-cd05-40ed-8e51-7f5c17c630de	f19638bb-61b1-4b78-a135-a8b3f4d90f47	20	7.000000000000000000000000000000	0.000000000000000000000000000000	140.000000000000000000000000000000
17566083-135b-423b-a5f5-b3284eaea79d	79c5a542-cd05-40ed-8e51-7f5c17c630de	b76c47dd-9b43-4fb4-b029-ed292564a91d	2	48.000000000000000000000000000000	0.000000000000000000000000000000	96.000000000000000000000000000000
ff8d3232-cb94-48df-87a5-34ac5193c5c7	79c5a542-cd05-40ed-8e51-7f5c17c630de	f4860788-c8eb-44d0-ad31-cb91237ddc6e	0.5	80.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
3682575a-3f4f-4e76-a793-941c67173985	9616175a-367b-47f4-ae74-38c73b6f5bbc	e37123ad-b974-41a0-aa7a-8767ea131f0f	0.1	200.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
d8af859d-2d9c-4ad3-9ecf-3e6367340b5d	9616175a-367b-47f4-ae74-38c73b6f5bbc	24c655ee-f53d-4be1-84d3-cb079a116f84	0.047	150.000000000000000000000000000000	0.000000000000000000000000000000	7.050000000000000000000000000000
41cb195f-c8aa-4904-ab95-222c1d3d37c0	9616175a-367b-47f4-ae74-38c73b6f5bbc	ae2fdf74-5886-4738-817d-6a24986531d8	1	15.000000000000000000000000000000	0.000000000000000000000000000000	15.000000000000000000000000000000
319f33b2-3013-4e67-b87b-6e370db3c0e5	9616175a-367b-47f4-ae74-38c73b6f5bbc	4dd43df6-f17a-47b9-b9ae-33ca2619dcee	1	15.000000000000000000000000000000	0.000000000000000000000000000000	15.000000000000000000000000000000
88cba45d-bbb1-421f-b9b6-710d32d9003e	3dff8aa1-d454-4d1b-bf14-b2acb187cea6	435dd281-e5f2-4710-b106-ec539bd08d68	2	28.000000000000000000000000000000	0.000000000000000000000000000000	56.000000000000000000000000000000
ac9e3570-7a94-481d-ba60-0a51c8b1caf9	1f3d4814-4cb3-467b-bd40-9730f1535f94	435dd281-e5f2-4710-b106-ec539bd08d68	1	28.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000
3324c5da-15d4-4b0b-a26a-2eab1c94d5d4	1f3d4814-4cb3-467b-bd40-9730f1535f94	a475b5d0-7d00-41cd-8b02-53ba58432676	1	22.000000000000000000000000000000	0.000000000000000000000000000000	22.000000000000000000000000000000
f2c8e7d7-b223-40eb-b7f0-e405061c7f1b	58405f8d-52c6-4695-9d80-2495c2acffe7	4d08148e-1214-40fb-8bfc-8cc033070930	1	45.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000
e0437267-b2da-4059-8654-da8de8a9c939	05945b63-3035-4fd8-a853-241e41359726	4d08148e-1214-40fb-8bfc-8cc033070930	3	45.000000000000000000000000000000	0.000000000000000000000000000000	135.000000000000000000000000000000
f47767ff-fbc6-4883-805d-bb59333fda55	4e78f266-17f4-4846-9fdd-f3a8642564dd	2efe28e3-0f70-40e6-92dd-b7678b4b6979	1	5.000000000000000000000000000000	0.000000000000000000000000000000	5.000000000000000000000000000000
7a26a43c-71a5-444a-8e47-7c6e18215708	4e78f266-17f4-4846-9fdd-f3a8642564dd	e4ab569e-c068-4280-affc-14a1b2626bd0	1	5.000000000000000000000000000000	0.000000000000000000000000000000	5.000000000000000000000000000000
b1f04780-a49b-43e5-95eb-ada951178f1d	98b00e3d-6ad1-4d7d-a77f-dfaa573ecb37	926119be-1158-4cba-bac7-bb876764775e	0.5	24.000000000000000000000000000000	0.000000000000000000000000000000	12.000000000000000000000000000000
5ee24d38-679b-4521-a56c-34157b5c9883	98b00e3d-6ad1-4d7d-a77f-dfaa573ecb37	d605ddae-019d-4f30-b484-f9b7e7ba0180	0.5	30.000000000000000000000000000000	0.000000000000000000000000000000	15.000000000000000000000000000000
45a9a2b6-7e4a-4a97-b143-6c8495f2a3ad	98b00e3d-6ad1-4d7d-a77f-dfaa573ecb37	1dc784da-c211-412a-9227-341ba89a3070	0.1	140.000000000000000000000000000000	0.000000000000000000000000000000	14.000000000000000000000000000000
b37dd9cd-5010-4648-b2aa-08c2aca8aaa3	98b00e3d-6ad1-4d7d-a77f-dfaa573ecb37	435dd281-e5f2-4710-b106-ec539bd08d68	1	28.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000
14b283c5-8573-4868-a7be-841860393ea0	10ed29f2-2f3d-4163-b335-ea0a7038588c	4dd1a7c2-d58a-4864-945e-8d1c3f14ee42	1	58.000000000000000000000000000000	0.000000000000000000000000000000	58.000000000000000000000000000000
c6f8cef8-35aa-449d-83f4-1f9d3644e787	10ed29f2-2f3d-4163-b335-ea0a7038588c	2e57bf68-514b-462a-b407-1c6b43630053	0.5	80.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
86648d26-f605-4e63-99ab-4b8146c9cb41	10ed29f2-2f3d-4163-b335-ea0a7038588c	26b155d6-9643-4d5c-b73f-6709eecd97d8	2	40.000000000000000000000000000000	0.000000000000000000000000000000	80.000000000000000000000000000000
31066ec6-eef3-4116-87cb-0869175ea3a6	2c5d9396-5e0a-433e-80a7-730e65047fce	b555cc65-c8a9-481f-88ca-d33245728e96	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
dd104b7f-c733-4f82-bdfe-b9c13ab807d2	2c5d9396-5e0a-433e-80a7-730e65047fce	7eebfb3b-6bd4-446f-864b-d5bca2191add	1	40.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
3ca83f66-6c5d-41d6-af4b-67ec2bee39ca	3ab57084-028f-4031-ab2a-bb22f1ad785e	f660f568-e2d3-4662-88db-f1645d260fad	2	10.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
b9fc0efd-6b88-4e06-8308-7277930aed55	3ab57084-028f-4031-ab2a-bb22f1ad785e	7e8bc9f2-92a9-4c9c-bcb5-45d7f0e949ac	1	10.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
a6321f35-5e2b-4f9d-9b88-52c43a755e97	0a1144e8-f468-49ac-a4e1-1c5123ea0e63	435dd281-e5f2-4710-b106-ec539bd08d68	2	28.000000000000000000000000000000	0.000000000000000000000000000000	56.000000000000000000000000000000
df086b9a-934f-45c9-a806-ccdfdc30e99e	31a7e56b-5ff1-48ef-81fc-a5e405dda1ed	ae2fdf74-5886-4738-817d-6a24986531d8	1	15.000000000000000000000000000000	0.000000000000000000000000000000	15.000000000000000000000000000000
8db88fbb-3c41-43ac-9823-8fde04bdea21	31a7e56b-5ff1-48ef-81fc-a5e405dda1ed	4dd43df6-f17a-47b9-b9ae-33ca2619dcee	1	15.000000000000000000000000000000	0.000000000000000000000000000000	15.000000000000000000000000000000
9969f5ef-0317-4859-affb-53e6ebc1de32	31a7e56b-5ff1-48ef-81fc-a5e405dda1ed	33a4d4fe-31bb-4678-9c7d-af1e69c78b8a	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
7356c3ad-6b95-45cd-8ec3-f764a6eadd40	72d44bab-8eb1-44a4-a0f7-e1c2a74e28c2	7eebfb3b-6bd4-446f-864b-d5bca2191add	1	40.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
59eebf86-fa70-40e6-93a4-ae564e7b36b4	e2fd05ef-5842-4160-bac7-8a58de0edf14	d6e097fb-8a28-48fd-92e2-e62e4f7aaedc	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
8e50e395-3ab2-497d-b3f4-f04823a41b2a	5319d2ba-b457-419b-a528-7d9a77e6a9ff	0c6b0140-bb85-4092-8a5e-2d73c9b4898c	0.1	70.000000000000000000000000000000	0.000000000000000000000000000000	7.000000000000000000000000000000
d195371a-19b8-477a-adba-de504c2698ff	5319d2ba-b457-419b-a528-7d9a77e6a9ff	f19638bb-61b1-4b78-a135-a8b3f4d90f47	10	7.000000000000000000000000000000	0.000000000000000000000000000000	70.000000000000000000000000000000
30e048f6-898c-4100-8528-4443829d660a	219ff6b2-52d8-4d7c-9951-e1bd5853b1d2	4dd43df6-f17a-47b9-b9ae-33ca2619dcee	1	15.000000000000000000000000000000	0.000000000000000000000000000000	15.000000000000000000000000000000
46633723-b981-4981-8025-17fd198f292a	219ff6b2-52d8-4d7c-9951-e1bd5853b1d2	180b0787-f024-4f32-83b5-2410a6a49be7	1	90.000000000000000000000000000000	0.000000000000000000000000000000	90.000000000000000000000000000000
43b223ca-f500-4dd1-be7d-3ca335fe3b4e	219ff6b2-52d8-4d7c-9951-e1bd5853b1d2	7ea6d19f-5bab-4419-88ec-5346521b06b0	1	50.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
4a03fd98-9b79-45be-b6c6-091cba196570	ee76e276-7ede-4847-8d16-68ca831e4cad	ea203e57-af8b-49c7-a8c7-92e486b2dc75	1	74.000000000000000000000000000000	0.000000000000000000000000000000	74.000000000000000000000000000000
685e15eb-b5c7-4937-80b1-18283687a8b0	ee76e276-7ede-4847-8d16-68ca831e4cad	c3b3a3f1-af77-4d79-ba00-8fa9c3ea2895	1	40.500000000000000000000000000000	0.000000000000000000000000000000	40.500000000000000000000000000000
535c50a4-1d75-49d1-8555-4804d0d49319	9c1edb53-2fbc-4d3a-9720-f4d99e6171e3	f4860788-c8eb-44d0-ad31-cb91237ddc6e	1	80.000000000000000000000000000000	0.000000000000000000000000000000	80.000000000000000000000000000000
c8c208ce-5459-40bd-98fb-cde3c0b69859	9c1edb53-2fbc-4d3a-9720-f4d99e6171e3	e492a32c-8bf1-49c4-acb5-34ded825a8b5	2	30.000000000000000000000000000000	0.000000000000000000000000000000	60.000000000000000000000000000000
b3eafacf-a974-4b27-bdf1-bc86af5340cb	7fb32710-49cf-4f0c-9831-f1fc918f93fc	0ffdfeb1-d65b-4b98-ad70-2f806feda001	2	20.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
f8d0f4a9-250a-408e-8199-baa353388517	83c8ba3f-79d8-4042-938a-4c9ccdcb8896	8fc26424-df23-421c-8c1d-a69da40b2fe9	1	10.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
0ca953f5-7c2b-49a8-84bf-ae812b30b946	d9a0c960-fab4-4dba-8f10-d546e8b3ba84	b555cc65-c8a9-481f-88ca-d33245728e96	2	25.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
38229429-f1e4-453c-b8e7-8895c01fe1f6	d9a0c960-fab4-4dba-8f10-d546e8b3ba84	910349e2-d4ca-4079-a749-d7ee89eb5de5	4	18.000000000000000000000000000000	0.000000000000000000000000000000	72.000000000000000000000000000000
f0170b3c-17bc-42c7-a370-270e5dc8e9b5	d9a0c960-fab4-4dba-8f10-d546e8b3ba84	9d5532ca-6247-455f-9d2f-f9471f4372b7	2	10.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
102cc28b-dd40-461f-8149-2e82e3611a01	d9a0c960-fab4-4dba-8f10-d546e8b3ba84	d6e097fb-8a28-48fd-92e2-e62e4f7aaedc	2	25.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
267b7488-10f8-4d2e-be8f-e29acd81efce	7fe2ccae-26fd-41ad-b9c4-2e9343294f3f	5ad02031-e6bd-4e18-9755-91981425a3b5	1	50.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
38dc9f71-49d0-432a-8a05-e90ff5b021ad	1e5d6967-830a-4d36-b8e2-2a6d34709202	0ffdfeb1-d65b-4b98-ad70-2f806feda001	1	20.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
ca890966-00a5-40db-9789-0a807512bc3e	f1a19dff-52dc-4d3e-af33-d3605584aae1	2efe28e3-0f70-40e6-92dd-b7678b4b6979	2	5.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
619829ba-c305-44c9-93f6-f5082073c017	a79447f0-b14c-4afb-ba06-eb8733ed7793	d605ddae-019d-4f30-b484-f9b7e7ba0180	0.5	30.000000000000000000000000000000	0.000000000000000000000000000000	15.000000000000000000000000000000
b1bd9438-cee9-4dde-9c8d-bdb5a5bd94aa	a79447f0-b14c-4afb-ba06-eb8733ed7793	0c6b0140-bb85-4092-8a5e-2d73c9b4898c	0.5	70.000000000000000000000000000000	0.000000000000000000000000000000	35.000000000000000000000000000000
94a3fa1b-cc69-4c02-a62f-8edae4cbc8b6	a79447f0-b14c-4afb-ba06-eb8733ed7793	e37123ad-b974-41a0-aa7a-8767ea131f0f	0.1	200.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
6dc22247-b003-42c3-ae94-42f5ce6bfb5c	e977e9c0-af52-460f-ba53-569bfb22c350	f42f4989-6901-4593-af7a-a2a84b4db5e2	1	35.000000000000000000000000000000	0.000000000000000000000000000000	35.000000000000000000000000000000
9c726d67-379e-4d06-988b-c94141f927f1	71fbff4a-22c6-4eb2-8992-aa59ccb40692	1f9b0b86-4afb-411f-9cd7-f4f16b9f20c5	4	5.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
bbac6528-bd19-480c-9cc9-2301ab2bf268	1774e418-bb7c-4be1-8b3c-c2c5b41f4fa7	b555cc65-c8a9-481f-88ca-d33245728e96	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
50958588-2fa8-44ef-a0ce-8e64fffe36dc	1774e418-bb7c-4be1-8b3c-c2c5b41f4fa7	910349e2-d4ca-4079-a749-d7ee89eb5de5	1	18.000000000000000000000000000000	0.000000000000000000000000000000	18.000000000000000000000000000000
c15ea76a-3533-4543-99d9-7d0a27dd9f5b	f99bae49-289b-43dc-b41f-25571296997c	6186659c-1ced-4a40-9b19-d984c6e0f038	1	40.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
b45abdf8-1a7f-41c0-9064-a8ae077beb38	e8960483-3011-4b70-b878-1ea1d6ea8340	04e0026b-f453-448e-8093-6613aa1ecf77	2	52.000000000000000000000000000000	0.000000000000000000000000000000	104.000000000000000000000000000000
fdfbad7b-deec-48dc-899a-0007866e7636	e8960483-3011-4b70-b878-1ea1d6ea8340	2efe28e3-0f70-40e6-92dd-b7678b4b6979	2	5.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
3e26ab92-acf0-4192-b879-4884812c0528	d02b708e-ee87-4cd4-a18a-37edc995fdc7	0ffdfeb1-d65b-4b98-ad70-2f806feda001	1	20.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
db0602c1-0679-48e4-878f-3460f13890f4	7a0536ed-3dab-4aa9-97e7-52e07bf51090	1f9b0b86-4afb-411f-9cd7-f4f16b9f20c5	4	5.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
808c5cd4-79fb-49db-a5c9-e60ed490be41	9cb4bbca-04a3-435e-b52c-bb54b6e9206a	114643b7-272f-4ae7-b5af-893680757c9d	2	46.500000000000000000000000000000	0.000000000000000000000000000000	93.000000000000000000000000000000
abd6e232-4156-4fd4-b4c1-b3d0fe7c6f61	9cb4bbca-04a3-435e-b52c-bb54b6e9206a	ea203e57-af8b-49c7-a8c7-92e486b2dc75	1	74.000000000000000000000000000000	0.000000000000000000000000000000	74.000000000000000000000000000000
6c9fbde9-ae25-4ee2-96d8-446dee2d7110	9cb4bbca-04a3-435e-b52c-bb54b6e9206a	8582a0bd-84ba-4a27-a808-c9acc493eb04	0.25	230.000000000000000000000000000000	0.000000000000000000000000000000	57.500000000000000000000000000000
2069593e-89f5-4903-b742-2a61e8bc645c	9d6fe8d8-3272-4826-a813-693dd5e1081a	33a4d4fe-31bb-4678-9c7d-af1e69c78b8a	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
7146e341-567c-46a8-a587-69062c26c8e1	a4c0d966-8e35-4c40-be59-c6faab6a2bd5	435dd281-e5f2-4710-b106-ec539bd08d68	1	28.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000
4bec38a7-dbd7-4f7f-91ad-802a279cd8fe	e0be237e-54a3-4dd9-bab1-283e3f0f0788	6186659c-1ced-4a40-9b19-d984c6e0f038	1	40.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
ed31c4ff-5cef-4a38-a5c5-faaf3d59c909	e0be237e-54a3-4dd9-bab1-283e3f0f0788	01d06378-50ce-4362-9afe-6eed56b27533	3	22.000000000000000000000000000000	0.000000000000000000000000000000	66.000000000000000000000000000000
bbebf407-baf9-4abf-a4ad-2ed21e1dd01c	e0be237e-54a3-4dd9-bab1-283e3f0f0788	f602879f-1598-4085-8e8a-378aaefe0f39	1	122.000000000000000000000000000000	0.000000000000000000000000000000	122.000000000000000000000000000000
567af06d-7046-4499-b3c9-c1858f007f0e	4207a86d-f10e-483d-b849-f753aeb2958a	5ad02031-e6bd-4e18-9755-91981425a3b5	1	50.000000000000000000000000000000	0.000000000000000000000000000000	50.000000000000000000000000000000
7ad7674c-8db2-4d6c-b56c-848f98f2ba16	266698b8-363e-454f-98bc-36b57d60c05d	0ffdfeb1-d65b-4b98-ad70-2f806feda001	1	20.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
9243e5ac-0069-45ef-b384-8bb2ef54da4f	c808d5bb-98c9-436e-b113-c96be2cb3718	0ffdfeb1-d65b-4b98-ad70-2f806feda001	1	20.000000000000000000000000000000	0.000000000000000000000000000000	20.000000000000000000000000000000
285d339f-0c9a-4bb5-9e96-4568856f68ce	8aab329a-9063-40d6-affb-eaf40c1f1d70	435dd281-e5f2-4710-b106-ec539bd08d68	1	28.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000
3766d192-0499-4bba-bcd3-fa2d56db5c6c	ee76e276-7ede-4847-8d16-68ca831e4cad	24c655ee-f53d-4be1-84d3-cb079a116f84	0.05	150.000000000000000000000000000000	0.000000000000000000000000000000	7.500000000000000000000000000000
8ecd3510-7211-4f0a-bb75-cd119f1b205f	ee76e276-7ede-4847-8d16-68ca831e4cad	0cf260dc-dd0c-4c65-949f-38ab6311a7e2	1	80.000000000000000000000000000000	0.000000000000000000000000000000	80.000000000000000000000000000000
ca84c589-a8fd-486a-94dc-9a07b5657519	ee76e276-7ede-4847-8d16-68ca831e4cad	67e8daa2-2c84-4a32-9c91-fce50f6c1401	1	22.000000000000000000000000000000	0.000000000000000000000000000000	22.000000000000000000000000000000
95a695e9-3599-425d-9faf-4f3e79e7f93e	772483bc-f401-4fdc-9326-940f12de552c	b555cc65-c8a9-481f-88ca-d33245728e96	1	25.000000000000000000000000000000	0.000000000000000000000000000000	25.000000000000000000000000000000
b0abbd47-5124-4d5d-ac58-534a87ac163c	772483bc-f401-4fdc-9326-940f12de552c	9d5532ca-6247-455f-9d2f-f9471f4372b7	1	10.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
7bf22f8f-96d2-416f-98f4-0ba3ac889306	2b5d5578-f699-4fe9-be3c-597b8ee56743	9f9df6fb-6264-4411-83a3-0c956417609a	0.07	100.000000000000000000000000000000	0.000000000000000000000000000000	7.000000000000001000000000000000
9aafe58a-879e-4130-878d-6cf01b1bdfaf	2b5d5578-f699-4fe9-be3c-597b8ee56743	e37123ad-b974-41a0-aa7a-8767ea131f0f	0.15	200.000000000000000000000000000000	0.000000000000000000000000000000	30.000000000000000000000000000000
13599291-fd9e-45d7-b08f-012f8a951776	2b5d5578-f699-4fe9-be3c-597b8ee56743	926119be-1158-4cba-bac7-bb876764775e	0.5	24.000000000000000000000000000000	0.000000000000000000000000000000	12.000000000000000000000000000000
434999b7-ae31-43cb-8d02-dc9ee42e5e67	2b5d5578-f699-4fe9-be3c-597b8ee56743	d605ddae-019d-4f30-b484-f9b7e7ba0180	1	30.000000000000000000000000000000	0.000000000000000000000000000000	30.000000000000000000000000000000
88bef345-76ab-42a0-a126-7dcfcb77187f	2b5d5578-f699-4fe9-be3c-597b8ee56743	7eebfb3b-6bd4-446f-864b-d5bca2191add	1	40.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
5c994d23-4b2c-4bbd-b8f5-d2e7d5af8a29	2b5d5578-f699-4fe9-be3c-597b8ee56743	80c0a9d3-e844-4fbd-b0e9-beebfb1078f0	2	5.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
cf61d5b0-23e9-412d-bb55-8a494a08f575	2b5d5578-f699-4fe9-be3c-597b8ee56743	4d08148e-1214-40fb-8bfc-8cc033070930	1	45.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000
3530e4dd-6c5e-4752-a9a3-4368a6760523	8b14821a-6a38-48b0-bd0f-900c99b7d1f7	435dd281-e5f2-4710-b106-ec539bd08d68	1	28.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000
36b74302-a0aa-457f-aa1a-2bd050b6c6c4	16bd78ed-83bf-4048-a09d-b39d08ea3b53	435dd281-e5f2-4710-b106-ec539bd08d68	1	28.000000000000000000000000000000	0.000000000000000000000000000000	28.000000000000000000000000000000
64977e1c-360a-47cf-bf88-45c93406c6ec	16bd78ed-83bf-4048-a09d-b39d08ea3b53	a113fa7a-f1dd-4f04-b57c-286330d1d2d3	1	29.000000000000000000000000000000	0.000000000000000000000000000000	29.000000000000000000000000000000
f7483b86-f771-428c-9154-74228ed9095e	f257d825-3ebd-4ad4-a15d-f6f145caa26c	1f9b0b86-4afb-411f-9cd7-f4f16b9f20c5	2	5.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
10ad75f1-36f8-46cd-a7f2-50eb67f34caf	f257d825-3ebd-4ad4-a15d-f6f145caa26c	2efe28e3-0f70-40e6-92dd-b7678b4b6979	2	5.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
ed8dfc32-7ed2-4451-9fdd-7d1da5f63234	16bd78ed-83bf-4048-a09d-b39d08ea3b53	d605ddae-019d-4f30-b484-f9b7e7ba0180	1	30.000000000000000000000000000000	0.000000000000000000000000000000	30.000000000000000000000000000000
c281bed3-4004-4f87-8b10-0cfe7e1adaa2	16bd78ed-83bf-4048-a09d-b39d08ea3b53	4d08148e-1214-40fb-8bfc-8cc033070930	1	45.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000
41d21cc1-c18a-4bea-af7d-21188f620d3d	68f4e561-afc8-4280-8f60-e7d6ac4b22cd	2efe28e3-0f70-40e6-92dd-b7678b4b6979	8	5.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
c98b5323-3f77-4c56-b7b2-b81d4dac8e7c	68f4e561-afc8-4280-8f60-e7d6ac4b22cd	e4ab569e-c068-4280-affc-14a1b2626bd0	2	5.000000000000000000000000000000	0.000000000000000000000000000000	10.000000000000000000000000000000
299dd9af-9056-420e-9c24-75cfcff62bce	7da671f4-5c41-47eb-b60a-5f51491955f5	f19638bb-61b1-4b78-a135-a8b3f4d90f47	10	7.000000000000000000000000000000	0.000000000000000000000000000000	70.000000000000000000000000000000
68e20059-e80d-423b-913d-53525a7ec1f7	7da671f4-5c41-47eb-b60a-5f51491955f5	878a443c-7a3c-4cb0-bd98-cc9c03d05c19	1	45.000000000000000000000000000000	0.000000000000000000000000000000	45.000000000000000000000000000000
9eb54d49-e317-4d7a-a2d7-27343a6df2b7	7da671f4-5c41-47eb-b60a-5f51491955f5	8bdda71c-7e17-444e-9517-26d1a102fe97	3	30.000000000000000000000000000000	0.000000000000000000000000000000	90.000000000000000000000000000000
8b20edac-59c1-45b6-ab76-538c30538980	7da671f4-5c41-47eb-b60a-5f51491955f5	f660f568-e2d3-4662-88db-f1645d260fad	3	10.000000000000000000000000000000	0.000000000000000000000000000000	30.000000000000000000000000000000
feabb493-471c-4f30-ba4c-c4e4340440fa	7da671f4-5c41-47eb-b60a-5f51491955f5	26b155d6-9643-4d5c-b73f-6709eecd97d8	1	40.000000000000000000000000000000	0.000000000000000000000000000000	40.000000000000000000000000000000
\.


--
-- Data for Name: Supermarket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Supermarket" (id, name, address, phone, "createdAt", "updatedAt") FROM stdin;
e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	BeNostra Mart	123 Market St	555-0123	2025-12-26 15:02:56.882	2025-12-26 15:38:26.971
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Supplier" (id, "supermarketId", name, phone, address, "gstNumber", "isActive") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, "supermarketId", username, password, role, name, pin, "createdAt", "updatedAt") FROM stdin;
91d0b5dd-0e26-428e-ba69-70c7d7aca2e6	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	admin	$2b$10$QJMY9W0y6pHyKAy3IK49Aujc3uPMpxTrbfkHTunTDHUaw5gaPWuqy	ADMIN	Super Admin	\N	2025-12-26 15:02:57.333	2025-12-26 15:02:57.333
bd94ea28-84f2-4416-90f9-8f9b1b646081	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	cashier	$2b$10$QJMY9W0y6pHyKAy3IK49Aujc3uPMpxTrbfkHTunTDHUaw5gaPWuqy	BILLING_STAFF	John Doe	1234	2025-12-26 15:02:57.667	2025-12-26 15:02:57.667
57d3672e-1fd7-4797-9378-fbf855d45a75	e97d0eb4-1dd0-4fa9-b0f1-6d8831f0b221	manager	$2b$10$QJMY9W0y6pHyKAy3IK49Aujc3uPMpxTrbfkHTunTDHUaw5gaPWuqy	stock_manager	Stock Manager	1234	2025-12-26 15:02:57.997	2025-12-26 15:20:13.248
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-12-24 15:15:46
20211116045059	2025-12-24 15:15:47
20211116050929	2025-12-24 15:15:48
20211116051442	2025-12-24 15:15:48
20211116212300	2025-12-24 15:15:49
20211116213355	2025-12-24 15:15:50
20211116213934	2025-12-24 15:15:51
20211116214523	2025-12-24 15:15:52
20211122062447	2025-12-24 15:15:52
20211124070109	2025-12-24 15:15:53
20211202204204	2025-12-24 15:15:54
20211202204605	2025-12-24 15:15:54
20211210212804	2025-12-24 15:15:57
20211228014915	2025-12-24 15:15:57
20220107221237	2025-12-24 15:15:58
20220228202821	2025-12-24 15:15:59
20220312004840	2025-12-24 15:16:00
20220603231003	2025-12-24 15:16:01
20220603232444	2025-12-24 15:16:01
20220615214548	2025-12-24 15:16:02
20220712093339	2025-12-24 15:16:03
20220908172859	2025-12-24 15:16:04
20220916233421	2025-12-24 15:16:04
20230119133233	2025-12-24 15:16:05
20230128025114	2025-12-24 15:16:06
20230128025212	2025-12-24 15:16:07
20230227211149	2025-12-24 15:16:08
20230228184745	2025-12-24 15:16:08
20230308225145	2025-12-24 15:16:09
20230328144023	2025-12-24 15:16:10
20231018144023	2025-12-24 15:16:10
20231204144023	2025-12-24 15:16:12
20231204144024	2025-12-24 15:16:12
20231204144025	2025-12-24 15:16:13
20240108234812	2025-12-24 15:16:14
20240109165339	2025-12-24 15:16:14
20240227174441	2025-12-24 15:16:16
20240311171622	2025-12-24 15:16:17
20240321100241	2025-12-24 15:16:18
20240401105812	2025-12-24 15:16:20
20240418121054	2025-12-24 15:16:21
20240523004032	2025-12-24 15:16:24
20240618124746	2025-12-24 15:16:24
20240801235015	2025-12-24 15:16:25
20240805133720	2025-12-24 15:16:26
20240827160934	2025-12-24 15:16:27
20240919163303	2025-12-24 15:16:28
20240919163305	2025-12-24 15:16:28
20241019105805	2025-12-24 15:16:29
20241030150047	2025-12-24 15:16:32
20241108114728	2025-12-24 15:16:33
20241121104152	2025-12-24 15:16:33
20241130184212	2025-12-24 15:16:34
20241220035512	2025-12-24 15:16:35
20241220123912	2025-12-24 15:16:36
20241224161212	2025-12-24 15:16:36
20250107150512	2025-12-24 15:16:37
20250110162412	2025-12-24 15:16:38
20250123174212	2025-12-24 15:16:38
20250128220012	2025-12-24 15:16:39
20250506224012	2025-12-24 15:16:40
20250523164012	2025-12-24 15:16:40
20250714121412	2025-12-24 15:16:41
20250905041441	2025-12-24 15:16:42
20251103001201	2025-12-24 15:16:43
20251120212548	2026-02-04 16:43:47
20251120215549	2026-02-04 16:43:48
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-12-24 15:15:44.610444
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-12-24 15:15:44.64255
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-12-24 15:15:44.671124
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-12-24 15:15:44.709073
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-12-24 15:15:44.716582
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-12-24 15:15:44.7317
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-12-24 15:15:44.738402
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-12-24 15:15:44.760306
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-12-24 15:15:44.767902
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-12-24 15:15:44.774753
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-12-24 15:15:44.781824
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-12-24 15:15:44.804918
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-12-24 15:15:44.813273
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-12-24 15:15:44.820734
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-12-24 15:15:44.82755
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-12-24 15:15:44.836469
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-12-24 15:15:44.843462
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-12-24 15:15:44.852753
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-12-24 15:15:44.872445
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-12-24 15:15:44.886244
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-12-24 15:15:44.893728
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-12-24 15:15:44.900807
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-12-24 15:15:45.698092
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-12-24 15:15:45.760735
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-12-24 15:15:45.767787
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-12-24 15:15:45.781341
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-12-24 15:15:45.7886
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2025-12-24 15:15:45.812496
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2025-12-24 15:15:44.649757
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2025-12-24 15:15:44.724092
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2025-12-24 15:15:44.745715
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2025-12-24 15:15:44.752907
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2025-12-24 15:15:44.907769
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2025-12-24 15:15:44.923039
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2025-12-24 15:15:45.629483
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2025-12-24 15:15:45.638389
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2025-12-24 15:15:45.645595
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2025-12-24 15:15:45.653715
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2025-12-24 15:15:45.661919
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2025-12-24 15:15:45.669963
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2025-12-24 15:15:45.672383
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2025-12-24 15:15:45.680651
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2025-12-24 15:15:45.687409
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2025-12-24 15:15:45.706232
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2025-12-24 15:15:45.718165
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2025-12-24 15:15:45.725753
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2025-12-24 15:15:45.735968
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2025-12-24 15:15:45.743935
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2025-12-24 15:15:45.753749
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2025-12-24 15:15:45.795314
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-02-02 13:44:12.257495
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-02-02 13:44:12.332488
52	drop-not-used-indexes-and-functions	bb0cbc7f2206a5a41113363dd22556cc1afd6327	2026-02-02 13:44:12.335558
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-02-02 13:44:12.371405
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-02-02 13:44:12.374936
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-02-02 13:44:12.376837
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: ProductBatch ProductBatch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductBatch"
    ADD CONSTRAINT "ProductBatch_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseItem PurchaseItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY (id);


--
-- Name: Purchase Purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_pkey" PRIMARY KEY (id);


--
-- Name: SaleItem SaleItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT "SaleItem_pkey" PRIMARY KEY (id);


--
-- Name: Sale Sale_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_pkey" PRIMARY KEY (id);


--
-- Name: Supermarket Supermarket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supermarket"
    ADD CONSTRAINT "Supermarket_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: Customer_supermarketId_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Customer_supermarketId_phone_key" ON public."Customer" USING btree ("supermarketId", phone);


--
-- Name: Product_supermarketId_barcode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Product_supermarketId_barcode_key" ON public."Product" USING btree ("supermarketId", barcode);


--
-- Name: User_supermarketId_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_supermarketId_username_key" ON public."User" USING btree ("supermarketId", username);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: Customer Customer_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Expense Expense_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Expense Expense_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductBatch ProductBatch_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductBatch"
    ADD CONSTRAINT "ProductBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductBatch ProductBatch_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductBatch"
    ADD CONSTRAINT "ProductBatch_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public."Purchase"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseItem PurchaseItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseItem PurchaseItem_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public."Purchase"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Purchase Purchase_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Purchase Purchase_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SaleItem SaleItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SaleItem SaleItem_saleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SaleItem"
    ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES public."Sale"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sale Sale_cashierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sale Sale_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Sale Sale_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Supplier Supplier_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_supermarketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_supermarketId_fkey" FOREIGN KEY ("supermarketId") REFERENCES public."Supermarket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict uYO2SUDWCJxzqdwfRwt0AqKEf0nd8yGiO3ShzDu5G2DXh7q3E2iLBGQYCLRigH9

