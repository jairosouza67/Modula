SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict SVdwYLx4WW0oqhP6T8Sm1apTWVrCugRyNOIg2edPL5mhULHhDf5lhLrKtRM9i0s

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at", "custom_claims_allowlist") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	2413a89b-8ec8-468c-8d57-6af851ec23c0	authenticated	authenticated	jairosouza673@gmail.com	$2a$10$IVTLO1RPXX.PTRtAXmsJW.H.7UNk7f8qdgd7RJYH8ZWZnrBJWvk9m	2026-05-16 19:12:18.197381+00	\N		2026-05-16 19:10:51.895587+00		\N			\N	2026-06-01 18:15:29.74201+00	{"provider": "email", "providers": ["email"]}	{"sub": "2413a89b-8ec8-468c-8d57-6af851ec23c0", "name": "Jairo Souza", "role": "vendedor", "email": "jairosouza673@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-05-16 19:10:51.869523+00	2026-06-01 18:15:29.770853+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	authenticated	authenticated	jairosouza67@gmail.com	$2a$10$lrhYZWBIi9XRSj4D7vWoX.KYpP4O1.FNfW2F1pVnlR3zIH9GUYXci	2026-05-12 06:24:54.228753+00	\N		2026-05-12 06:22:18.780667+00		\N			\N	2026-07-20 19:31:16.820024+00	{"provider": "email", "providers": ["email"]}	{"sub": "0323f8f5-d06d-433d-a3ed-0e82a8aa7508", "name": "JAIRO SANTOS SOUZA", "role": "vendedor", "email": "jairosouza67@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-05-12 06:22:18.775885+00	2026-07-20 23:36:42.269901+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
0323f8f5-d06d-433d-a3ed-0e82a8aa7508	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	{"sub": "0323f8f5-d06d-433d-a3ed-0e82a8aa7508", "name": "JAIRO SANTOS SOUZA", "role": "vendedor", "email": "jairosouza67@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-05-12 06:22:18.778493+00	2026-05-12 06:22:18.778537+00	2026-05-12 06:22:18.778537+00	19cb4527-83f3-41df-9081-7273155dd3e1
2413a89b-8ec8-468c-8d57-6af851ec23c0	2413a89b-8ec8-468c-8d57-6af851ec23c0	{"sub": "2413a89b-8ec8-468c-8d57-6af851ec23c0", "name": "Jairo Souza", "role": "vendedor", "email": "jairosouza673@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-05-16 19:10:51.890773+00	2026-05-16 19:10:51.890822+00	2026-05-16 19:10:51.890822+00	8a3ea6c7-d545-4354-8e77-58de66719bf6
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
009c6c54-9e0f-4883-b477-ac40c87675f1	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-30 16:40:06.74143+00	2026-07-02 16:41:59.965285+00	\N	aal1	\N	2026-07-02 16:41:59.964582	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	131.0.89.196	\N	\N	\N	\N	\N
c062b78f-7455-45a6-b130-c7e539eae934	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-07-02 17:24:22.630854+00	2026-07-02 17:24:22.630854+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	131.0.89.196	\N	\N	\N	\N	\N
62b67e71-8b44-49e6-8d20-9a93f37f1884	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-30 17:47:10.095859+00	2026-07-02 17:38:05.988678+00	\N	aal1	\N	2026-07-02 17:38:05.988048	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	131.0.89.196	\N	\N	\N	\N	\N
d22e66be-bb9e-4925-844f-8091029d68db	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-30 17:57:11.383085+00	2026-07-02 17:41:07.78631+00	\N	aal1	\N	2026-07-02 17:41:07.785567	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.127.0 Chrome/148.0.7778.97 Electron/42.2.0 Safari/537.36	131.0.89.193	\N	\N	\N	\N	\N
10c4900d-464b-4b06-9bd8-451ff7068244	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-30 19:04:09.953259+00	2026-06-30 19:04:09.953259+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	45.188.121.106	\N	\N	\N	\N	\N
5c2b8c38-ec71-4b46-920a-e6acc4dfb50b	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-07-02 17:42:29.703868+00	2026-07-02 17:42:29.703868+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.127.0 Chrome/148.0.7778.97 Electron/42.2.0 Safari/537.36	131.0.89.193	\N	\N	\N	\N	\N
0dad7823-28ee-4860-9a37-268cfba2cdba	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-30 14:18:32.599311+00	2026-07-01 10:03:31.961141+00	\N	aal1	\N	2026-07-01 10:03:31.961032	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.126.0 Chrome/148.0.7778.97 Electron/42.2.0 Safari/537.36	45.163.223.93	\N	\N	\N	\N	\N
1da6b94b-8f9a-4e17-b8b1-05f87ccab6a1	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-26 13:10:34.358465+00	2026-07-03 00:10:42.400221+00	\N	aal1	\N	2026-07-03 00:10:42.399612	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	131.0.89.196	\N	\N	\N	\N	\N
6ef8c761-7d8a-4698-8482-3b7a19f7f3bd	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-26 13:09:21.621499+00	2026-06-26 13:09:21.621499+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	45.163.223.93	\N	\N	\N	\N	\N
22ed27f4-288e-4a9b-b2dc-b187b2e30c26	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-26 13:57:55.276271+00	2026-06-26 13:57:55.276271+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code-Insiders/1.123.0-insider Chrome/148.0.7778.97 Electron/42.2.0 Safari/537.36	45.163.223.93	\N	\N	\N	\N	\N
97be2fd0-4757-41c7-bbd0-95f94334b13b	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-07-01 11:42:19.015814+00	2026-07-01 11:42:19.015814+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	45.163.223.93	\N	\N	\N	\N	\N
f3bc3742-4a9f-4d69-8eda-dd9caf4af4a8	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-07-01 10:14:50.201333+00	2026-07-01 13:30:59.030317+00	\N	aal1	\N	2026-07-01 13:30:59.029663	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.126.0 Chrome/148.0.7778.97 Electron/42.2.0 Safari/537.36	45.163.223.93	\N	\N	\N	\N	\N
b058acf6-8ff4-487a-8b50-6375ac712650	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-26 13:10:40.950651+00	2026-07-01 13:32:50.480299+00	\N	aal1	\N	2026-07-01 13:32:50.479618	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	45.163.223.93	\N	\N	\N	\N	\N
0520d227-120d-47dc-b304-b820977ff8a9	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-06-30 18:01:32.096593+00	2026-07-08 13:50:00.082187+00	\N	aal1	\N	2026-07-08 13:50:00.081405	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	179.151.166.105	\N	\N	\N	\N	\N
a654a1c4-f438-436d-acdb-dfbf94d555b9	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-07-03 15:35:45.857984+00	2026-07-08 13:50:02.406096+00	\N	aal1	\N	2026-07-08 13:50:02.405983	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	187.68.199.56	\N	\N	\N	\N	\N
24587a34-f23d-482d-9ce0-682a0b6153f1	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	2026-07-20 19:31:16.821127+00	2026-07-20 23:36:42.282989+00	\N	aal1	\N	2026-07-20 23:36:42.281967	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	170.238.165.73	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
6ef8c761-7d8a-4698-8482-3b7a19f7f3bd	2026-06-26 13:09:21.643914+00	2026-06-26 13:09:21.643914+00	password	b3060f83-7c8e-4483-b2b9-81147d3dff3c
1da6b94b-8f9a-4e17-b8b1-05f87ccab6a1	2026-06-26 13:10:34.376345+00	2026-06-26 13:10:34.376345+00	password	0eb51e7a-e5d4-48ee-9841-ceba0eecc94b
b058acf6-8ff4-487a-8b50-6375ac712650	2026-06-26 13:10:40.955731+00	2026-06-26 13:10:40.955731+00	password	8b33f3db-26f2-4317-ae98-2d7bc885b0ef
22ed27f4-288e-4a9b-b2dc-b187b2e30c26	2026-06-26 13:57:55.314856+00	2026-06-26 13:57:55.314856+00	password	f3f0bf39-8770-4d78-a602-c5a09ec3a027
0dad7823-28ee-4860-9a37-268cfba2cdba	2026-06-30 14:18:32.666221+00	2026-06-30 14:18:32.666221+00	password	277072cd-b5c7-47a6-8d96-079a77416274
009c6c54-9e0f-4883-b477-ac40c87675f1	2026-06-30 16:40:06.761285+00	2026-06-30 16:40:06.761285+00	password	2ea08589-838a-4047-abc2-803eb52cc99b
62b67e71-8b44-49e6-8d20-9a93f37f1884	2026-06-30 17:47:10.134476+00	2026-06-30 17:47:10.134476+00	password	bffdd4c6-4f3f-416c-945c-a692505b4bd8
d22e66be-bb9e-4925-844f-8091029d68db	2026-06-30 17:57:11.403639+00	2026-06-30 17:57:11.403639+00	password	b9ab16d1-d171-4ca0-9363-43b3338760c5
0520d227-120d-47dc-b304-b820977ff8a9	2026-06-30 18:01:32.115192+00	2026-06-30 18:01:32.115192+00	password	75c5093e-a2a3-4ae9-b2c7-099339891ef7
10c4900d-464b-4b06-9bd8-451ff7068244	2026-06-30 19:04:09.983283+00	2026-06-30 19:04:09.983283+00	password	818b353a-dd65-4b0b-a218-02f54909fe44
f3bc3742-4a9f-4d69-8eda-dd9caf4af4a8	2026-07-01 10:14:50.230057+00	2026-07-01 10:14:50.230057+00	password	64f7936f-bc24-41d1-a17a-55bfbb45a92e
97be2fd0-4757-41c7-bbd0-95f94334b13b	2026-07-01 11:42:19.050404+00	2026-07-01 11:42:19.050404+00	password	53963ea9-f773-400c-b34d-2c3f35135463
c062b78f-7455-45a6-b130-c7e539eae934	2026-07-02 17:24:22.688639+00	2026-07-02 17:24:22.688639+00	password	a2a8f0cc-3054-46b0-b2a4-b65cc484c978
5c2b8c38-ec71-4b46-920a-e6acc4dfb50b	2026-07-02 17:42:29.748317+00	2026-07-02 17:42:29.748317+00	password	8f425eca-0745-4a86-bcfa-3acb5dfd20e6
a654a1c4-f438-436d-acdb-dfbf94d555b9	2026-07-03 15:35:45.929685+00	2026-07-03 15:35:45.929685+00	password	67545adf-19d7-4cfa-bd9d-cd494f204444
24587a34-f23d-482d-9ce0-682a0b6153f1	2026-07-20 19:31:16.916673+00	2026-07-20 19:31:16.916673+00	password	ade44c29-eb7b-4730-9d69-27e3091296aa
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	146	zredqzoe6wgn	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-06-26 13:57:55.304651+00	2026-06-26 13:57:55.304651+00	\N	22ed27f4-288e-4a9b-b2dc-b187b2e30c26
00000000-0000-0000-0000-000000000000	145	ixkquar6qrrs	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-26 13:10:40.954182+00	2026-06-26 14:20:12.853483+00	\N	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	147	uy4ny2ukdtb2	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-26 14:20:12.861068+00	2026-06-29 13:34:58.626486+00	ixkquar6qrrs	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	144	bsgxu4ny57pj	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-26 13:10:34.371546+00	2026-06-29 13:35:04.864827+00	\N	1da6b94b-8f9a-4e17-b8b1-05f87ccab6a1
00000000-0000-0000-0000-000000000000	148	grwfskffdete	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-29 13:34:58.646452+00	2026-06-30 09:57:31.296261+00	uy4ny2ukdtb2	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	152	7q2mx244jjty	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 16:40:06.756156+00	2026-06-30 17:44:49.958681+00	\N	009c6c54-9e0f-4883-b477-ac40c87675f1
00000000-0000-0000-0000-000000000000	156	lyfucmdwmb5l	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 18:01:32.110687+00	2026-06-30 19:00:10.545606+00	\N	0520d227-120d-47dc-b304-b820977ff8a9
00000000-0000-0000-0000-000000000000	158	6q54umqiugfg	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-06-30 19:04:09.973278+00	2026-06-30 19:04:09.973278+00	\N	10c4900d-464b-4b06-9bd8-451ff7068244
00000000-0000-0000-0000-000000000000	155	3euhib5hu7xd	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 17:57:11.396539+00	2026-06-30 19:43:53.196793+00	\N	d22e66be-bb9e-4925-844f-8091029d68db
00000000-0000-0000-0000-000000000000	154	mghjacci47hv	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 17:47:10.12535+00	2026-06-30 19:44:26.079298+00	\N	62b67e71-8b44-49e6-8d20-9a93f37f1884
00000000-0000-0000-0000-000000000000	153	5kblkv2qdp3n	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 17:44:49.968872+00	2026-06-30 20:20:53.891636+00	7q2mx244jjty	009c6c54-9e0f-4883-b477-ac40c87675f1
00000000-0000-0000-0000-000000000000	159	wgessqdltd5t	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 19:43:53.203887+00	2026-06-30 20:45:29.431921+00	3euhib5hu7xd	d22e66be-bb9e-4925-844f-8091029d68db
00000000-0000-0000-0000-000000000000	160	pcdgjnsdhiln	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 19:44:26.079953+00	2026-06-30 20:48:05.373759+00	mghjacci47hv	62b67e71-8b44-49e6-8d20-9a93f37f1884
00000000-0000-0000-0000-000000000000	157	uwbs5kcerohb	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 19:00:10.557683+00	2026-06-30 22:20:52.87711+00	lyfucmdwmb5l	0520d227-120d-47dc-b304-b820977ff8a9
00000000-0000-0000-0000-000000000000	151	zjmhb4bbtpie	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 14:18:32.636854+00	2026-07-01 10:03:31.912251+00	\N	0dad7823-28ee-4860-9a37-268cfba2cdba
00000000-0000-0000-0000-000000000000	165	ixyhu5lfqrhr	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-01 10:03:31.932637+00	2026-07-01 10:03:31.932637+00	zjmhb4bbtpie	0dad7823-28ee-4860-9a37-268cfba2cdba
00000000-0000-0000-0000-000000000000	150	bvetx2yyjbuy	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 09:57:31.318856+00	2026-07-01 10:35:40.880889+00	grwfskffdete	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	166	ql4t5sww6hoy	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-01 10:14:50.222225+00	2026-07-01 11:30:13.875151+00	\N	f3bc3742-4a9f-4d69-8eda-dd9caf4af4a8
00000000-0000-0000-0000-000000000000	167	ljfer3lpuvf7	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-01 10:35:40.887892+00	2026-07-01 11:34:06.578249+00	bvetx2yyjbuy	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	170	ou6qjv7ymmgk	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-01 11:42:19.040212+00	2026-07-01 11:42:19.040212+00	\N	97be2fd0-4757-41c7-bbd0-95f94334b13b
00000000-0000-0000-0000-000000000000	168	rilgpc2ln33l	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-01 11:30:13.881105+00	2026-07-01 12:32:50.930527+00	ql4t5sww6hoy	f3bc3742-4a9f-4d69-8eda-dd9caf4af4a8
00000000-0000-0000-0000-000000000000	169	t5wxa2zjr7h2	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-01 11:34:06.584244+00	2026-07-01 12:34:21.97277+00	ljfer3lpuvf7	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	171	dcv5peobrfo5	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-01 12:32:50.94369+00	2026-07-01 13:30:58.999891+00	rilgpc2ln33l	f3bc3742-4a9f-4d69-8eda-dd9caf4af4a8
00000000-0000-0000-0000-000000000000	173	lsbad4yi2tkb	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-01 13:30:59.008665+00	2026-07-01 13:30:59.008665+00	dcv5peobrfo5	f3bc3742-4a9f-4d69-8eda-dd9caf4af4a8
00000000-0000-0000-0000-000000000000	172	6iid5dhxsgex	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-01 12:34:21.979699+00	2026-07-01 13:32:50.454816+00	t5wxa2zjr7h2	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	174	7fxrondsrdiv	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-01 13:32:50.462509+00	2026-07-01 13:32:50.462509+00	6iid5dhxsgex	b058acf6-8ff4-487a-8b50-6375ac712650
00000000-0000-0000-0000-000000000000	149	6ttfjez2ai77	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-29 13:35:04.865232+00	2026-07-01 13:39:24.206343+00	bsgxu4ny57pj	1da6b94b-8f9a-4e17-b8b1-05f87ccab6a1
00000000-0000-0000-0000-000000000000	162	g7vd634fvjrn	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 20:45:29.435737+00	2026-07-02 16:35:26.397167+00	wgessqdltd5t	d22e66be-bb9e-4925-844f-8091029d68db
00000000-0000-0000-0000-000000000000	161	c6cj7xm22iwq	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 20:20:53.907262+00	2026-07-02 16:41:59.941886+00	5kblkv2qdp3n	009c6c54-9e0f-4883-b477-ac40c87675f1
00000000-0000-0000-0000-000000000000	177	idac37nsw77s	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-02 16:41:59.949099+00	2026-07-02 16:41:59.949099+00	c6cj7xm22iwq	009c6c54-9e0f-4883-b477-ac40c87675f1
00000000-0000-0000-0000-000000000000	178	yhibikwnaq6d	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-02 17:24:22.659213+00	2026-07-02 17:24:22.659213+00	\N	c062b78f-7455-45a6-b130-c7e539eae934
00000000-0000-0000-0000-000000000000	163	43sqntuvmi3u	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 20:48:05.37484+00	2026-07-02 17:38:05.967258+00	pcdgjnsdhiln	62b67e71-8b44-49e6-8d20-9a93f37f1884
00000000-0000-0000-0000-000000000000	179	ijrihjbusof5	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-02 17:38:05.973658+00	2026-07-02 17:38:05.973658+00	43sqntuvmi3u	62b67e71-8b44-49e6-8d20-9a93f37f1884
00000000-0000-0000-0000-000000000000	176	hz4mrxfxbzru	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-02 16:35:26.415035+00	2026-07-02 17:41:07.760348+00	g7vd634fvjrn	d22e66be-bb9e-4925-844f-8091029d68db
00000000-0000-0000-0000-000000000000	180	2sxsoosd4zkg	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-02 17:41:07.767399+00	2026-07-02 17:41:07.767399+00	hz4mrxfxbzru	d22e66be-bb9e-4925-844f-8091029d68db
00000000-0000-0000-0000-000000000000	181	sug4644ofx2y	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-02 17:42:29.734099+00	2026-07-02 17:42:29.734099+00	\N	5c2b8c38-ec71-4b46-920a-e6acc4dfb50b
00000000-0000-0000-0000-000000000000	175	22ozwgzs5mw2	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-01 13:39:24.212591+00	2026-07-02 23:11:29.534597+00	6ttfjez2ai77	1da6b94b-8f9a-4e17-b8b1-05f87ccab6a1
00000000-0000-0000-0000-000000000000	182	4hadwqjdwtet	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-02 23:11:29.565116+00	2026-07-03 00:10:42.360338+00	22ozwgzs5mw2	1da6b94b-8f9a-4e17-b8b1-05f87ccab6a1
00000000-0000-0000-0000-000000000000	183	45yqa4emgxrt	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-03 00:10:42.374575+00	2026-07-03 00:10:42.374575+00	4hadwqjdwtet	1da6b94b-8f9a-4e17-b8b1-05f87ccab6a1
00000000-0000-0000-0000-000000000000	164	5fonedydvvxd	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-06-30 22:20:52.886608+00	2026-07-03 02:12:48.064164+00	uwbs5kcerohb	0520d227-120d-47dc-b304-b820977ff8a9
00000000-0000-0000-0000-000000000000	185	tlp2b7f5z5xv	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-03 15:35:45.894286+00	2026-07-03 16:52:16.607255+00	\N	a654a1c4-f438-436d-acdb-dfbf94d555b9
00000000-0000-0000-0000-000000000000	186	tsxtp5tpifjp	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-03 16:52:16.624205+00	2026-07-03 21:38:29.855374+00	tlp2b7f5z5xv	a654a1c4-f438-436d-acdb-dfbf94d555b9
00000000-0000-0000-0000-000000000000	143	cptal4lp2dmf	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-06-26 13:09:21.633551+00	2026-06-26 13:09:21.633551+00	\N	6ef8c761-7d8a-4698-8482-3b7a19f7f3bd
00000000-0000-0000-0000-000000000000	184	s7dip2gyzwgb	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-03 02:12:48.079397+00	2026-07-08 01:23:08.965154+00	5fonedydvvxd	0520d227-120d-47dc-b304-b820977ff8a9
00000000-0000-0000-0000-000000000000	188	3jdx2jcr7jlp	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-08 01:23:08.994077+00	2026-07-08 13:50:00.031855+00	s7dip2gyzwgb	0520d227-120d-47dc-b304-b820977ff8a9
00000000-0000-0000-0000-000000000000	189	jjgka2gfy2ji	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-08 13:50:00.055597+00	2026-07-08 13:50:00.055597+00	3jdx2jcr7jlp	0520d227-120d-47dc-b304-b820977ff8a9
00000000-0000-0000-0000-000000000000	187	vegrajfhnkwu	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-03 21:38:29.873885+00	2026-07-08 13:50:02.394004+00	tsxtp5tpifjp	a654a1c4-f438-436d-acdb-dfbf94d555b9
00000000-0000-0000-0000-000000000000	190	xrnyoudysljo	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-08 13:50:02.397859+00	2026-07-08 13:50:02.397859+00	vegrajfhnkwu	a654a1c4-f438-436d-acdb-dfbf94d555b9
00000000-0000-0000-0000-000000000000	191	opki5mzunals	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-20 19:31:16.867212+00	2026-07-20 22:38:00.453392+00	\N	24587a34-f23d-482d-9ce0-682a0b6153f1
00000000-0000-0000-0000-000000000000	192	whrgjqmgvvun	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	t	2026-07-20 22:38:00.471947+00	2026-07-20 23:36:42.250072+00	opki5mzunals	24587a34-f23d-482d-9ce0-682a0b6153f1
00000000-0000-0000-0000-000000000000	193	cyklnw7cyrwy	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	f	2026-07-20 23:36:42.261203+00	2026-07-20 23:36:42.261203+00	whrgjqmgvvun	24587a34-f23d-482d-9ce0-682a0b6153f1
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: _keepalive_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."_keepalive_log" ("id", "executed_at", "status", "details") FROM stdin;
1	2026-06-21 06:00:00.208261+00	ok	{"source": "pg_cron", "timestamp_utc": "2026-06-21T06:00:00.208261+00:00", "empresas_count": 1}
2	2026-06-22 06:00:00.179072+00	ok	{"source": "pg_cron", "timestamp_utc": "2026-06-22T06:00:00.179072+00:00", "empresas_count": 1}
3	2026-06-23 06:00:00.186346+00	ok	{"source": "pg_cron", "timestamp_utc": "2026-06-23T06:00:00.186346+00:00", "empresas_count": 1}
4	2026-06-24 06:00:00.177578+00	ok	{"source": "pg_cron", "timestamp_utc": "2026-06-24T06:00:00.177578+00:00", "empresas_count": 1}
5	2026-06-24 15:02:37.547457+00	ok	{"source": "github-actions", "elapsed_ms": 289, "timestamp_utc": "2026-06-24T15:02:37.471Z"}
6	2026-06-25 06:00:00.176376+00	ok	{"source": "pg_cron", "timestamp_utc": "2026-06-25T06:00:00.176376+00:00", "empresas_count": 1}
7	2026-06-25 11:45:27.552782+00	ok	{"source": "github-actions", "elapsed_ms": 1043, "timestamp_utc": "2026-06-25T11:45:27.309Z"}
8	2026-06-26 06:00:00.174749+00	ok	{"source": "pg_cron", "timestamp_utc": "2026-06-26T06:00:00.174749+00:00", "empresas_count": 1}
9	2026-06-26 11:48:28.567002+00	ok	{"source": "github-actions", "elapsed_ms": 1287, "timestamp_utc": "2026-06-26T11:48:28.508Z"}
10	2026-06-27 11:01:17.043597+00	ok	{"source": "github-actions", "elapsed_ms": 1158, "timestamp_utc": "2026-06-27T11:01:16.867Z"}
11	2026-06-28 11:12:49.866798+00	ok	{"source": "github-actions", "elapsed_ms": 1436, "timestamp_utc": "2026-06-28T11:12:49.617Z"}
12	2026-06-29 13:12:34.238921+00	ok	{"source": "github-actions", "elapsed_ms": 1116, "timestamp_utc": "2026-06-29T13:12:33.968Z"}
13	2026-06-30 11:48:05.905728+00	ok	{"source": "github-actions", "elapsed_ms": 913, "timestamp_utc": "2026-06-30T11:48:05.730Z"}
14	2026-07-01 12:13:24.275517+00	ok	{"source": "github-actions", "elapsed_ms": 651, "timestamp_utc": "2026-07-01T12:13:24.053Z"}
15	2026-07-02 11:39:30.836954+00	ok	{"source": "github-actions", "elapsed_ms": 1424, "timestamp_utc": "2026-07-02T11:39:30.558Z"}
16	2026-07-02 18:26:22.198549+00	ok	{"source": "github-actions", "elapsed_ms": 1166, "timestamp_utc": "2026-07-02T18:26:21.247Z"}
17	2026-07-03 11:38:01.966811+00	ok	{"source": "github-actions", "elapsed_ms": 1167, "timestamp_utc": "2026-07-03T11:38:01.837Z"}
18	2026-07-04 10:57:22.787994+00	ok	{"source": "github-actions", "elapsed_ms": 1263, "timestamp_utc": "2026-07-04T10:57:22.509Z"}
19	2026-07-05 11:08:24.126035+00	ok	{"source": "github-actions", "elapsed_ms": 1066, "timestamp_utc": "2026-07-05T11:08:24.044Z"}
20	2026-07-06 12:55:01.833004+00	ok	{"source": "github-actions", "elapsed_ms": 1288, "timestamp_utc": "2026-07-06T12:55:01.717Z"}
21	2026-07-07 11:59:22.357246+00	ok	{"source": "github-actions", "elapsed_ms": 1278, "timestamp_utc": "2026-07-07T11:59:22.087Z"}
22	2026-07-08 11:10:03.99077+00	ok	{"source": "github-actions", "elapsed_ms": 1296, "timestamp_utc": "2026-07-08T11:10:03.693Z"}
23	2026-07-09 12:11:42.942201+00	ok	{"source": "github-actions", "elapsed_ms": 1072, "timestamp_utc": "2026-07-09T12:11:42.830Z"}
24	2026-07-10 12:04:07.52503+00	ok	{"source": "github-actions", "elapsed_ms": 1179, "timestamp_utc": "2026-07-10T12:04:07.326Z"}
25	2026-07-11 10:20:39.471494+00	ok	{"source": "github-actions", "elapsed_ms": 1113, "timestamp_utc": "2026-07-11T10:20:39.327Z"}
26	2026-07-12 10:38:56.911938+00	ok	{"source": "github-actions", "elapsed_ms": 1304, "timestamp_utc": "2026-07-12T10:38:56.631Z"}
27	2026-07-13 12:13:19.605093+00	ok	{"source": "github-actions", "elapsed_ms": 1063, "timestamp_utc": "2026-07-13T12:13:19.443Z"}
28	2026-07-14 10:52:41.705157+00	ok	{"source": "github-actions", "elapsed_ms": 1230, "timestamp_utc": "2026-07-14T10:52:41.479Z"}
29	2026-07-15 10:56:51.541863+00	ok	{"source": "github-actions", "elapsed_ms": 1287, "timestamp_utc": "2026-07-15T10:56:51.310Z"}
30	2026-07-16 11:05:42.327743+00	ok	{"source": "github-actions", "elapsed_ms": 1159, "timestamp_utc": "2026-07-16T11:05:42.158Z"}
31	2026-07-17 10:52:56.218539+00	ok	{"source": "github-actions", "elapsed_ms": 1135, "timestamp_utc": "2026-07-17T10:52:56.141Z"}
32	2026-07-18 10:23:45.887376+00	ok	{"source": "github-actions", "elapsed_ms": 1463, "timestamp_utc": "2026-07-18T10:23:45.605Z"}
33	2026-07-19 10:39:07.977172+00	ok	{"source": "github-actions", "elapsed_ms": 1276, "timestamp_utc": "2026-07-19T10:39:07.664Z"}
34	2026-07-20 11:51:48.540936+00	ok	{"source": "github-actions", "elapsed_ms": 1207, "timestamp_utc": "2026-07-20T11:51:48.413Z"}
35	2026-07-21 11:12:58.934282+00	ok	{"source": "github-actions", "elapsed_ms": 1413, "timestamp_utc": "2026-07-21T11:12:58.653Z"}
36	2026-07-22 11:13:53.617207+00	ok	{"source": "github-actions", "elapsed_ms": 1466, "timestamp_utc": "2026-07-22T11:13:53.322Z"}
37	2026-07-23 11:15:40.580488+00	ok	{"source": "github-actions", "elapsed_ms": 1246, "timestamp_utc": "2026-07-23T11:15:40.254Z"}
38	2026-07-24 11:06:44.028603+00	ok	{"source": "github-actions", "elapsed_ms": 1194, "timestamp_utc": "2026-07-24T11:06:43.893Z"}
39	2026-07-25 10:39:00.074377+00	ok	{"source": "github-actions", "elapsed_ms": 1336, "timestamp_utc": "2026-07-25T10:38:59.980Z"}
40	2026-07-26 10:47:39.220733+00	ok	{"source": "github-actions", "elapsed_ms": 1458, "timestamp_utc": "2026-07-26T10:47:39.019Z"}
41	2026-07-27 12:31:56.146374+00	ok	{"source": "github-actions", "elapsed_ms": 1068, "timestamp_utc": "2026-07-27T12:31:56.080Z"}
\.


--
-- Data for Name: empresas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."empresas" ("id", "nome_fantasia", "razao_social", "cnpj", "endereco", "certificado_digital", "created_at", "updated_at", "cidade", "telefone", "inscricao_estadual", "codigo_municipio", "crt", "cep", "bairro", "logradouro", "numero_endereco", "complemento", "uf") FROM stdin;
00000000-0000-0000-0000-000000000001	Vidraçaria Orçamental	Vidraçaria Orçamental	14.032.864/0001-08	AV. GIL FERREIRA PESSOA, Nº 70 - MATINHA\t\t\t\t\t\t\t\t\t\t	A1 - valido ate 12/2026	2026-05-12 05:53:41.71486+00	2026-06-30 20:14:01.128745+00	Livramento de Nossa Senhora - BA	(77) 99995-9280 / (77) 3444-1022 / (77) 98145-5902	096918958	2919504	1	46140000	Taquari	Avenida Gil Ferreira Pessoa	70	Galpao	\N
\.


--
-- Data for Name: categorias_financeiras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."categorias_financeiras" ("id", "empresa_id", "parent_id", "codigo", "nome", "tipo", "ativo", "criado_em", "atualizado_em") FROM stdin;
89ff2036-f08c-4e7a-af0a-a039e58a5539	00000000-0000-0000-0000-000000000001	\N	1.01	Receita de Serviços	RECEITA	t	2026-05-28 20:10:18.580534+00	2026-05-28 20:10:18.580534+00
d7b33ce3-3b2c-4dc1-ac2c-ca6062308325	00000000-0000-0000-0000-000000000001	\N	2.01	Despesas Operacionais	DESPESA	t	2026-05-28 20:10:18.580534+00	2026-05-28 20:10:18.580534+00
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."clientes" ("id", "empresa_id", "nome", "documento", "tipo_documento", "contato", "segmento", "ultimo_contato", "volume_total", "created_at", "updated_at", "deleted_at", "email", "telefone", "endereco", "cidade", "representante", "referencia", "cep", "bairro", "uf", "numero_endereco", "complemento", "codigo_municipio", "inscricao_estadual") FROM stdin;
2f39045b-197d-40aa-a1e9-8d3d5315199c	00000000-0000-0000-0000-000000000001	Construtora Nova Era	12345678000190	cnpj	(11) 4002-8922	Construtoras	2026-05-09	84200.00	2026-05-16 19:39:54.381609+00	2026-05-16 19:39:54.381609+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
351a3440-4e1d-4e9a-b4ae-73c55fcd066d	00000000-0000-0000-0000-000000000001	Amanda Silva	98765432100	cpf	(11) 99876-5432	Arquitetos	2026-05-06	18940.00	2026-05-16 19:39:54.381609+00	2026-05-16 19:39:54.381609+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b6e4c736-6fff-4a68-9d57-0d7d5008fd70	00000000-0000-0000-0000-000000000001	Residencial Park Towers	23456789000112	cnpj	(11) 3344-5566	Residencial	2026-05-11	32180.00	2026-05-16 19:39:54.381609+00	2026-05-16 19:39:54.381609+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a2e29c23-ef58-4d72-b5ca-9c5ab449edef	00000000-0000-0000-0000-000000000001	Hotel Bela Vista	34567890000123	cnpj	(11) 2222-3333	Comercial	2026-04-29	56700.00	2026-05-16 19:39:54.381609+00	2026-05-16 19:39:54.381609+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
00d8011c-e3a1-4b83-b5a3-1db83d6de59d	00000000-0000-0000-0000-000000000001	Jairo Santos souza	85903999581	cpf	73988992794	Comercial	2026-05-16	1000.00	2026-05-16 19:39:54.381609+00	2026-05-16 21:38:58.254963+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: colaboradores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."colaboradores" ("id", "empresa_id", "nome", "cpf", "cargo", "salario", "status", "data_admissao", "data_demissao", "data_limite_ferias", "horas_extras_mes", "telefone", "email", "created_at", "updated_at") FROM stdin;
59492292-0c9b-4e41-97fd-18bb41e4946e	00000000-0000-0000-0000-000000000001	Vinicius Campos	85903999581	Instalador	3000.00	Ativo	2026-05-20	\N	2027-10-28	0.00	\N	\N	2026-05-20 00:23:10.586876+00	2026-05-20 00:23:10.586876+00
e2a3be6c-dd97-4432-bb3e-d082cf70bbe2	00000000-0000-0000-0000-000000000001	Márcia Souza	85903999581	técnico	3200.00	Ativo	2026-05-30	\N	2027-06-30	0.00	73988992794	bahmeira@outlook.com	2026-05-30 20:52:04.686362+00	2026-05-30 20:52:04.686362+00
e7dacb03-1d93-4d4c-970e-02453bb36ff5	00000000-0000-0000-0000-000000000001	Jose	85903999581	Vendedor	1000.00	Ativo	2026-01-22	\N	\N	0.00	\N	\N	2026-07-03 00:48:33.539516+00	2026-07-03 00:48:33.539516+00
\.


--
-- Data for Name: condicoes_pagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."condicoes_pagamento" ("id", "empresa_id", "codigo", "descricao", "prazos_dias", "desconto_pct", "acrescimo_pct", "aplicacao", "ativo", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: config_precos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."config_precos" ("id", "empresa_id", "categoria", "descricao", "valor", "created_at", "updated_at") FROM stdin;
9feaf61a-e48c-4124-887d-cffaeba91be7	00000000-0000-0000-0000-000000000001	vidro	Incolor 4mm	95.00	2026-05-12 05:53:41.71486+00	2026-05-12 05:53:41.71486+00
635c638d-e1fe-451e-9a5e-82fcc7c3aa6d	00000000-0000-0000-0000-000000000001	vidro	Fume 6mm	138.50	2026-05-12 05:53:41.71486+00	2026-05-12 05:53:41.71486+00
9df94fe0-1e16-48aa-b8dd-cf556d172c05	00000000-0000-0000-0000-000000000001	vidro	Laminado 8mm	214.90	2026-05-12 05:53:41.71486+00	2026-05-12 05:53:41.71486+00
cfabc983-2614-43e9-8a2a-0eeb37d2b623	00000000-0000-0000-0000-000000000001	processamento	Lapidacao	12.00	2026-05-12 05:53:41.71486+00	2026-05-12 05:53:41.71486+00
9eb9aa1c-7d01-4323-b2dc-fa45433c085a	00000000-0000-0000-0000-000000000001	processamento	Furo	8.50	2026-05-12 05:53:41.71486+00	2026-05-12 05:53:41.71486+00
d00a3108-895e-40a7-a866-498ca2f26199	00000000-0000-0000-0000-000000000001	processamento	Jateamento	24.00	2026-05-12 05:53:41.71486+00	2026-05-12 05:53:41.71486+00
\.


--
-- Data for Name: contas_bancarias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."contas_bancarias" ("id", "empresa_id", "nome", "tipo", "saldo_inicial", "saldo_atual", "ativo", "criado_em", "atualizado_em") FROM stdin;
1d4417b8-1ac7-4953-98be-a9352889b8fb	00000000-0000-0000-0000-000000000001	Caixa Principal	CAIXA	0.00	200.00	t	2026-05-28 20:10:18.580534+00	2026-05-28 20:10:18.580534+00
\.


--
-- Data for Name: fornecedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."fornecedores" ("id", "empresa_id", "nome", "cnpj", "contato", "categoria", "dados_fiscais", "dados_bancarios", "a_pagar", "vencimento", "created_at", "updated_at", "deleted_at") FROM stdin;
cb7b89c6-afff-4039-a8ba-f022d02e055e	00000000-0000-0000-0000-000000000001	Cebrace Cristal Plano	60.507.291/0001-02	(11) 4547-8000	Chapas temperadas	IE: 248.166.740.112	Banco do Brasil - Ag 1234 - CC 56789-0	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
b675d4d7-0b0b-481f-9d18-a321caf98ae6	00000000-0000-0000-0000-000000000001	Guardian Glass Brasil	04.240.605/0001-67	(11) 3039-3700	Chapas temperadas	IE: 386.118.557.114	Itaú - Ag 0987 - CC 12345-6	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
8fd29f43-413d-4b09-be7b-ee3677fdb027	00000000-0000-0000-0000-000000000001	Vivix Vidros Planos	02.947.298/0001-53	(33) 3271-2000	Chapas temperadas	IE: 186.804.370.0078	Bradesco - Ag 2345 - CC 67890-1	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
02419685-215e-45c3-ae7b-8fe218284b22	00000000-0000-0000-0000-000000000001	Alcoa Alumínio	23.637.697/0001-01	(11) 4688-2800	Perfis aluminio	IE: 636.083.662.114	Santander - Ag 3456 - CC 78901-2	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
e118228b-e0ed-4fac-885f-098a9f575d18	00000000-0000-0000-0000-000000000001	Hydro Alumínio	42.110.747/0001-50	(11) 3296-4500	Perfis aluminio	IE: 114.467.775.114	Banco do Brasil - Ag 4567 - CC 89012-3	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
25ab0462-ae15-4b83-bc26-0b005f92048a	00000000-0000-0000-0000-000000000001	Alumasa Perfis	15.233.891/0001-74	(35) 3449-6000	Perfis aluminio	IE: 518.311.620.0025	Caixa - Ag 5678 - CC 90123-4	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
354ae3d6-970e-4bc5-9041-1ee2c8c20265	00000000-0000-0000-0000-000000000001	Pado Fechaduras	61.073.946/0001-91	(11) 4166-9500	Ferragens box/janela	IE: 336.073.098.114	Itaú - Ag 6789 - CC 01234-5	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
0ca664fa-a0c4-4001-b869-9a98d5f8e420	00000000-0000-0000-0000-000000000001	Blindex Ferragens	33.530.486/0001-29	(11) 3648-7000	Ferragens box/janela	IE: 085.961.127.112	Bradesco - Ag 7890 - CC 12345-6	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
39c9aea5-d324-4817-af78-c22dd915c534	00000000-0000-0000-0000-000000000001	Toksteel Ferragens	08.715.932/0001-45	(47) 3036-9000	Ferragens box/janela	IE: 254.389.179	Santander - Ag 8901 - CC 23456-7	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
1f7717fb-cc24-4b77-96f6-15b7fda78913	00000000-0000-0000-0000-000000000001	Espelhos Decorativos BR	12.456.789/0001-88	(21) 2222-3333	Espelhos lapidados	IE: 77.382.594.0019	Banco do Brasil - Ag 9012 - CC 34567-8	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
33c1b078-bcf8-42ef-9fc4-63f84546e4bd	00000000-0000-0000-0000-000000000001	DistVidros Consumíveis	45.678.123/0001-56	(11) 3333-4444	Consumiveis	IE: 148.297.556.114	Caixa - Ag 0123 - CC 45678-9	0.00	\N	2026-05-27 21:21:15.745094+00	2026-05-27 21:21:15.745094+00	\N
\.


--
-- Data for Name: lancamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."lancamentos" ("id", "empresa_id", "conta_id", "categoria_id", "data_pagamento", "valor", "tipo", "descricao", "documento_ref", "conciliado", "criado_em", "atualizado_em") FROM stdin;
406d424e-c102-4b6b-af31-20d52a0c0a70	00000000-0000-0000-0000-000000000001	1d4417b8-1ac7-4953-98be-a9352889b8fb	89ff2036-f08c-4e7a-af0a-a039e58a5539	2026-05-28	1500.00	ENTRADA	Baixa de OS Jairo	8350b9b8-222f-4436-9878-c7a859b7e0f3	f	2026-05-28 20:13:19.375832+00	2026-05-28 20:13:19.375832+00
0a45909c-26bd-487d-afad-902c08c7eb3b	00000000-0000-0000-0000-000000000001	1d4417b8-1ac7-4953-98be-a9352889b8fb	d7b33ce3-3b2c-4dc1-ac2c-ca6062308325	2026-05-29	1300.00	SAIDA	Baixa de Adesivo	73e476c9-bc9a-40c7-b3be-c5e3ad1bf3f5	f	2026-05-29 16:04:53.07319+00	2026-05-29 16:04:53.07319+00
\.


--
-- Data for Name: orcamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."orcamentos" ("id", "empresa_id", "cliente_id", "numero", "descricao", "itens", "area_total", "valor_total", "status", "data_validade", "created_at", "updated_at", "deleted_at") FROM stdin;
8eae9f8a-ec79-4ec8-a777-7793cb8417e9	00000000-0000-0000-0000-000000000001	2f39045b-197d-40aa-a1e9-8d3d5315199c	ORC-2185	Adesivo	[{"altura": 1000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "BFJ", "processamentoCodigo": ""}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Kit Pivô Premium", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KPP"}, {"incluido": true, "descricao": "Fecho", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FX"}], "nomeServico": "Porta Pivotante Incolor 8mm", "codigoServico": "PPI8"}]	3.10	896.00	Aberto	2026-07-03	2026-06-18 19:47:40.895825+00	2026-06-18 19:48:29.356685+00	2026-06-18 19:48:29.393+00
8e772b12-ef9a-4f24-b5ca-46cec9550138	00000000-0000-0000-0000-000000000001	2f39045b-197d-40aa-a1e9-8d3d5315199c	ORC-8777	Box do banheiro 	[{"altura": 1000, "largura": 1000, "procIdx": 0, "tipoIdx": 0, "quantidade": 1}]	1.00	280.00	Aprovado	2026-05-31	2026-05-16 19:44:40.011678+00	2026-05-25 19:48:09.890749+00	2026-05-25 19:48:10.747+00
70a98a6e-abf8-43fb-8b29-860a1a785f52	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-4923	Box do banheiro 	[{"altura": 1000, "largura": 1000, "procIdx": 0, "tipoIdx": 6, "quantidade": 2}]	2.00	190.00	Aprovado	2026-05-31	2026-05-16 19:41:15.388397+00	2026-05-25 19:48:37.317872+00	2026-05-25 19:48:38.065+00
6ae53085-4052-4d78-a122-eecc675ff191	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-3141	Box banheiro de visitas	[{"altura": 1000, "largura": 1000, "quantidade": 1, "produtoCodigo": "BI", "processamentoCodigo": "JAT"}]	1.00	435.01	Aprovado	2026-06-10	2026-05-26 10:16:32.942657+00	2026-06-25 13:03:12.627072+00	2026-06-25 13:03:20.924+00
2a2728ea-d511-495b-98a5-d98a8c3b9510	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-1074	Box	[{"altura": 1000, "largura": 1000, "quantidade": 1, "produtoCodigo": "BI", "processamentoCodigo": "AD"}]	1.00	400.02	Aberto	2026-06-10	2026-05-26 10:23:22.909124+00	2026-05-27 21:34:55.438457+00	2026-05-27 21:34:58.03+00
9914f621-2524-47ac-bb5c-7c95fe70de08	00000000-0000-0000-0000-000000000001	2f39045b-197d-40aa-a1e9-8d3d5315199c	ORC-6639	Box do banheiro 	[{"altura": 1000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "BFJ", "processamentoCodigo": ""}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Box Vidro Fumê", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "BVF"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Kit Alumínio Box", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KAB"}], "nomeServico": "Box Verde/Fumê 8mm", "codigoServico": "BV"}]	3.10	996.00	Aberto	2026-07-02	2026-06-17 03:42:05.576338+00	2026-06-17 03:42:05.576338+00	\N
8bbcf375-16ec-450f-b2d0-f20ae68034db	00000000-0000-0000-0000-000000000001	a2e29c23-ef58-4d72-b5ca-9c5ab449edef	ORC-9621	porta 	[{"altura": 1000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "BFJ", "processamentoCodigo": ""}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Fechadura VA", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FVA"}], "nomeServico": "Porta Correr 2 Folhas Incolor 8mm", "codigoServico": "PCI2"}]	3.10	981.00	Aberto	2026-07-03	2026-06-18 19:36:30.384649+00	2026-06-18 19:36:30.384649+00	\N
2bdb8972-e6b3-489c-805b-f87b9bcaba4f	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-7995	Adesivo	[{"altura": 1000, "largura": 1000, "quantidade": 1, "produtoCodigo": "JVF8", "processamentoCodigo": ""}]	1.00	330.00	Expirado	2026-06-10	2026-05-26 10:26:23.082893+00	2026-06-25 13:03:16.578997+00	2026-06-25 13:03:24.95+00
1aca483e-3ac8-4097-81d7-e1ab3d08dacd	00000000-0000-0000-0000-000000000001	2f39045b-197d-40aa-a1e9-8d3d5315199c	ORC-1529	Box do banheiro 	[{"altura": 1000, "largura": 1000, "quantidade": 1, "produtoCodigo": "JVF8", "processamentoCodigo": "BST"}]	1.00	355.00	Aprovado	2026-06-13	2026-05-29 18:42:41.638161+00	2026-06-25 13:03:21.784646+00	2026-06-25 13:03:30.129+00
ca8f716f-f261-4c90-94d9-2e803e5e17a1	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-9170	Box do banheiro 	[{"altura": 3000, "largura": 2000, "quantidade": 1, "produtoCodigo": "BI", "processamentoCodigo": ""}]	6.00	2100.06	Aprovado	2026-06-15	2026-05-31 00:45:14.222309+00	2026-06-25 13:03:28.227975+00	2026-06-25 13:03:36.599+00
5bb716d5-d23f-4830-b704-52a18c32e79b	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-7048	Box	[{"altura": 1900, "largura": 1200, "quantidade": 1, "produtoCodigo": "VI8", "processamentoCodigo": ""}]	2.28	820.82	Aprovado	2026-06-16	2026-06-01 17:43:01.447784+00	2026-06-25 13:03:38.682557+00	2026-06-25 13:03:47.053+00
b8a9f385-ef78-43ed-928f-cf93984ee106	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-9486	OS Jairo	[{"altura": 1000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "BFJ", "processamentoCodigo": ""}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Borda/Fita J", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "BFJ"}], "nomeServico": "Janela Incolor 8mm", "codigoServico": "JI8"}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Kit Pivô Premium", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KPP"}, {"incluido": true, "descricao": "Fecho", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FX"}], "nomeServico": "Porta Pivotante Incolor 8mm", "codigoServico": "PPI8"}]	5.20	1757.00	Aberto	2026-07-03	2026-06-18 20:10:34.373816+00	2026-06-18 20:10:46.551789+00	\N
a39a88ab-c667-4d78-a9f1-371a9cbae045	00000000-0000-0000-0000-000000000001	a2e29c23-ef58-4d72-b5ca-9c5ab449edef	ORC-9652	Vidro Incolor 8mm	[{"altura": 1000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "FV", "processamentoCodigo": "BST"}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Borda/Fita J", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "BFJ"}], "nomeServico": "Janela Incolor 8mm", "codigoServico": "JI8"}]	3.10	1405.99	Aberto	2026-07-03	2026-06-18 20:17:57.832566+00	2026-06-18 20:40:53.437768+00	\N
d0d17e8c-a02f-4ffc-a647-466157111295	00000000-0000-0000-0000-000000000001	2f39045b-197d-40aa-a1e9-8d3d5315199c	ORC-1450	dzxzx	[{"altura": 2.1, "largura": 1.2, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Kit Pivô Premium", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KPP"}, {"incluido": true, "descricao": "Fecho", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FX"}], "nomeServico": "Porta Pivotante Incolor 8mm", "codigoServico": "PPI8"}]	2.52	1027.20	Aberto	2026-07-04	2026-06-19 15:27:11.354105+00	2026-06-19 15:27:11.354105+00	\N
928bfc30-7e29-4964-b5a1-009ad2e389a0	00000000-0000-0000-0000-000000000001	2f39045b-197d-40aa-a1e9-8d3d5315199c	ORC-4659	Casa de Júnior 	[{"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Verde 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VV8"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Kit Pivô Premium", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KPP"}, {"incluido": true, "descricao": "Fecho", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FX"}], "nomeServico": "Porta Pivotante Verde 8mm", "codigoServico": "PPV8"}]	2.10	1126.00	Aberto	2026-07-07	2026-06-22 16:52:06.264627+00	2026-06-22 16:52:06.264627+00	\N
bcb767f3-592c-45c7-b44c-d2143a129520	00000000-0000-0000-0000-000000000001	b6e4c736-6fff-4a68-9d57-0d7d5008fd70	ORC-9338	hujj	[{"altura": 2.5, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Verde 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VV8"}, {"incluido": true, "descricao": "Borda/Fita J", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "BFJ"}], "nomeServico": "Janela Verde/Fumê 8mm", "codigoServico": "JV8"}]	2.50	1255.00	Aberto	2026-07-03	2026-06-18 21:16:43.884591+00	2026-06-19 10:26:28.039271+00	2026-06-19 10:26:28.671+00
04dce260-3049-4c8e-ab52-7400990818f6	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	ORC-2213	box inc	[{"altura": 2.2, "largura": 1.5, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Box Incolor", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "BI"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Kit Alumínio Box", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KAB"}], "nomeServico": "Box Incolor 8mm", "codigoServico": "BI"}]	3.30	1312.50	Aberto	2026-07-04	2026-06-19 12:02:14.084914+00	2026-06-19 12:02:14.084914+00	\N
986e74b7-55cd-4302-8f75-1e721b88efc6	00000000-0000-0000-0000-000000000001	351a3440-4e1d-4e9a-b4ae-73c55fcd066d	ORC-2826	Bate Fecha Janela	[{"altura": 2000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "BFJ", "processamentoCodigo": ""}]	2.00	40.00	Aberto	2026-07-10	2026-06-25 13:05:29.644858+00	2026-06-25 13:05:41.720851+00	2026-06-25 13:05:50.069+00
42316535-b610-4d11-b8bb-d174c1dadae6	00000000-0000-0000-0000-000000000001	a2e29c23-ef58-4d72-b5ca-9c5ab449edef	ORC-1728	OS Jairo	[{"altura": 2.1, "largura": 1.8, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Fechadura VA", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FVA"}], "nomeServico": "Porta Correr 2 Folhas Incolor 8mm", "codigoServico": "PCI2"}]	3.78	1633.80	Aberto	2026-07-11	2026-06-26 12:56:14.565056+00	2026-06-26 12:56:14.565056+00	\N
887f1e60-ee29-44e5-9a29-2001139c7823	00000000-0000-0000-0000-000000000001	2f39045b-197d-40aa-a1e9-8d3d5315199c	ORC-1705	OS Jairo	[{"altura": 1000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "EB4", "processamentoCodigo": ""}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Kit Pivô Premium", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KPP"}, {"incluido": true, "descricao": "Fecho", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FX"}], "nomeServico": "Porta Pivotante Incolor 8mm", "codigoServico": "PPI8"}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Box Incolor", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "BI"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Kit Alumínio Box", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KAB"}], "nomeServico": "Box Incolor 8mm", "codigoServico": "BI"}]	5.20	2326.00	Aberto	2026-07-03	2026-06-18 20:44:41.408397+00	2026-07-02 23:56:49.550901+00	\N
\.


--
-- Data for Name: ordens_servico; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."ordens_servico" ("id", "empresa_id", "orcamento_id", "cliente_id", "tecnico_id", "numero", "status", "data_previsao", "itens", "created_at", "updated_at", "deleted_at", "is_atrasada", "hora_previsao", "status_instalacao", "endereco_instalacao") FROM stdin;
b631b8c3-884c-41e5-9668-a2709d05bef5	00000000-0000-0000-0000-000000000001	8e772b12-ef9a-4f24-b5ca-46cec9550138	2f39045b-197d-40aa-a1e9-8d3d5315199c	\N	OS-7580	Na Fila	2026-05-23	[{"altura": 1000, "largura": 1000, "procIdx": 0, "tipoIdx": 0, "quantidade": 1}]	2026-05-16 21:16:18.101066+00	2026-07-03 00:45:23.221689+00	2026-05-27 18:51:06.902+00	t	\N	Agendado	\N
3fefa571-40de-4050-bd47-f6224271d556	00000000-0000-0000-0000-000000000001	70a98a6e-abf8-43fb-8b29-860a1a785f52	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	\N	OS-3332	Concluido	\N	[{"altura": 1000, "largura": 1000, "procIdx": 0, "tipoIdx": 6, "quantidade": 2}]	2026-05-16 21:46:38.803529+00	2026-07-03 00:45:23.221689+00	\N	f	\N	\N	\N
0c5073c9-a6fd-48a7-8dec-c814fdaeecc3	00000000-0000-0000-0000-000000000001	2a2728ea-d511-495b-98a5-d98a8c3b9510	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	\N	OS-3858	Na Fila	2026-06-02	[{"altura": 1000, "largura": 1000, "quantidade": 1, "produtoCodigo": "BI", "processamentoCodigo": "AD"}]	2026-05-26 10:24:30.422544+00	2026-05-26 11:21:28.47383+00	2026-05-26 11:21:29.058+00	f	\N	Agendado	\N
34046035-d600-427b-8038-2d9318ce4878	00000000-0000-0000-0000-000000000001	ca8f716f-f261-4c90-94d9-2e803e5e17a1	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	59492292-0c9b-4e41-97fd-18bb41e4946e	OS-2125	Em Producao	\N	[{"altura": 3000, "largura": 2000, "quantidade": 1, "produtoCodigo": "BI", "processamentoCodigo": ""}]	2026-05-31 00:45:50.583751+00	2026-07-03 00:47:06.576298+00	\N	f	\N	\N	\N
865cb558-a02b-498e-9b68-81af3704c7d1	00000000-0000-0000-0000-000000000001	1aca483e-3ac8-4097-81d7-e1ab3d08dacd	2f39045b-197d-40aa-a1e9-8d3d5315199c	e2a3be6c-dd97-4432-bb3e-d082cf70bbe2	OS-9380	Em Producao	\N	[{"altura": 1000, "largura": 1000, "quantidade": 1, "produtoCodigo": "JVF8", "processamentoCodigo": "BST"}]	2026-05-29 18:42:51.090441+00	2026-07-03 00:48:59.94544+00	\N	f	\N	\N	\N
1d774c0e-e0e8-4352-a4fa-0ebfc4dee08a	00000000-0000-0000-0000-000000000001	6ae53085-4052-4d78-a122-eecc675ff191	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	e2a3be6c-dd97-4432-bb3e-d082cf70bbe2	OS-8350	Instalacao	\N	[{"altura": 1000, "largura": 1000, "quantidade": 1, "produtoCodigo": "BI", "processamentoCodigo": "JAT"}]	2026-05-26 10:18:01.10527+00	2026-07-03 00:49:04.086507+00	\N	f	\N	\N	\N
871d4708-b5bd-4dd2-b14e-4b31aacd18ea	00000000-0000-0000-0000-000000000001	5bb716d5-d23f-4830-b704-52a18c32e79b	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	e2a3be6c-dd97-4432-bb3e-d082cf70bbe2	OS-3475	Concluido	\N	[{"altura": 1900, "largura": 1200, "quantidade": 1, "produtoCodigo": "VI8", "processamentoCodigo": ""}]	2026-06-01 17:51:35.472558+00	2026-07-03 00:49:08.072367+00	\N	f	\N	\N	\N
cc2b14de-3cca-40c5-ace6-5d1c174bf650	00000000-0000-0000-0000-000000000001	b8a9f385-ef78-43ed-928f-cf93984ee106	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	\N	OS-2990	Na Fila	2026-06-25	[{"altura": 1000, "largura": 1000, "quantidade": 1, "componentes": [], "produtoCodigo": "BFJ", "processamentoCodigo": ""}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Kit Alumínio", "tipoPreco": "PC_ML", "quantidade": 1, "codigoProduto": "KA"}, {"incluido": true, "descricao": "Borda/Fita J", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "BFJ"}], "nomeServico": "Janela Incolor 8mm", "codigoServico": "JI8"}, {"altura": 2.1, "largura": 1, "adicional": 0, "quantidade": 1, "componentes": [{"incluido": true, "descricao": "Vidro Incolor 8mm", "tipoPreco": "M2", "quantidade": 1, "codigoProduto": "VI8"}, {"incluido": true, "descricao": "Pivô 40kg", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "PX40"}, {"incluido": true, "descricao": "Kit Pivô Premium", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "KPP"}, {"incluido": true, "descricao": "Fecho", "tipoPreco": "PC_FX", "quantidade": 1, "codigoProduto": "FX"}], "nomeServico": "Porta Pivotante Incolor 8mm", "codigoServico": "PPI8"}]	2026-06-18 20:10:42.435974+00	2026-06-18 20:10:46.235041+00	2026-06-18 20:10:46.776+00	f	\N	Agendado	\N
\.


--
-- Data for Name: contas_pagar_receber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."contas_pagar_receber" ("id", "empresa_id", "cliente_id", "fornecedor_id", "categoria_id", "data_vencimento", "data_competencia", "valor_previsto", "valor_pago", "status", "lancamento_id", "observacoes", "criado_em", "atualizado_em", "ordem_servico_id", "parcela") FROM stdin;
8350b9b8-222f-4436-9878-c7a859b7e0f3	00000000-0000-0000-0000-000000000001	00d8011c-e3a1-4b83-b5a3-1db83d6de59d	\N	89ff2036-f08c-4e7a-af0a-a039e58a5539	2026-05-28	2026-05-28	1500.00	1500.00	PAGO	406d424e-c102-4b6b-af31-20d52a0c0a70	OS Jairo	2026-05-28 20:11:19.121115+00	2026-05-28 20:11:19.121115+00	1d774c0e-e0e8-4352-a4fa-0ebfc4dee08a	\N
73e476c9-bc9a-40c7-b3be-c5e3ad1bf3f5	00000000-0000-0000-0000-000000000001	\N	33c1b078-bcf8-42ef-9fc4-63f84546e4bd	d7b33ce3-3b2c-4dc1-ac2c-ca6062308325	2026-06-06	2026-05-28	1300.00	1300.00	PAGO	0a45909c-26bd-487d-afad-902c08c7eb3b	Adesivo	2026-05-28 20:14:10.178581+00	2026-05-28 20:14:10.178581+00	\N	\N
\.


--
-- Data for Name: perfis_usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."perfis_usuario" ("id", "empresa_id", "user_id", "nome", "email", "role", "created_at", "updated_at") FROM stdin;
c4ec09b2-9384-46fc-b2d0-c3c9712c9e0c	00000000-0000-0000-0000-000000000001	0323f8f5-d06d-433d-a3ed-0e82a8aa7508	JAIRO SANTOS SOUZA	jairosouza67@gmail.com	superadmin	2026-05-12 11:37:38.948243+00	2026-06-01 04:44:34.285198+00
854f9a24-2e04-48bd-a592-a275939e3ddb	00000000-0000-0000-0000-000000000001	2413a89b-8ec8-468c-8d57-6af851ec23c0	Jairo Souza	jairosouza673@gmail.com	tecnico	2026-05-16 19:12:35.69604+00	2026-06-29 14:20:11.420921+00
\.


--
-- Data for Name: convites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."convites" ("id", "email", "role", "token", "empresa_id", "convidado_por", "expires_at", "usado_em", "created_at") FROM stdin;
\.


--
-- Data for Name: creditos_fornecedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."creditos_fornecedor" ("id", "empresa_id", "fornecedor_id", "tipo", "numero", "valor_original", "valor_disponivel", "data_emissao", "data_vencimento", "descricao", "status", "criado_por", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: formas_pagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."formas_pagamento" ("id", "empresa_id", "codigo", "descricao", "aplicacao", "ativo", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: pedidos_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pedidos_compra" ("id", "empresa_id", "numero", "fornecedor_id", "condicao_pagamento_id", "forma_pagamento_id", "previsao_entrega", "observacoes", "status", "status_liberacao", "justificativa_reprovacao", "limite_liberacao", "valor_total", "area_total_m2", "qtd_total_pecas", "data_conclusao", "criado_por", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: creditos_uso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."creditos_uso" ("id", "credito_id", "pedido_compra_id", "valor_utilizado", "data_uso", "criado_por") FROM stdin;
\.


--
-- Data for Name: empresa_secrets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."empresa_secrets" ("id", "empresa_id", "chave", "valor", "criado_em") FROM stdin;
9dcfacc2-c33c-4087-be06-eb733b70d088	00000000-0000-0000-0000-000000000001	focus_nfe_token	mE1pLmwxTXEohHSk7KaWSs0sbN8xU3yx	2026-07-01 10:53:15.996805+00
01df2a43-8d4d-47ce-8d85-528066961326	00000000-0000-0000-0000-000000000001	focus_nfe_ambiente	producao	2026-07-01 10:53:16.560387+00
\.


--
-- Data for Name: produtos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."produtos" ("id", "empresa_id", "codigo", "descricao", "unidade", "valor_compra", "margem_lucro", "categoria", "ativo", "created_at", "updated_at", "fornecedor_id", "ncm", "cest", "cfop", "unidade_fiscal", "origem") FROM stdin;
344aee6d-d7c6-4482-9d06-eb0a514c4f7a	00000000-0000-0000-0000-000000000001	VI6	Vidro Incolor 6mm	m²	136.99	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
1d8a5fcf-87e2-4be7-8ca2-d00b43d310de	00000000-0000-0000-0000-000000000001	VI8	Vidro Incolor 8mm	m²	246.58	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
50e18f84-e1a4-41d4-a7fd-862030919800	00000000-0000-0000-0000-000000000001	VI10	Vidro Incolor 10mm	m²	321.92	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
fd4fcbf7-85ed-4c17-b7a3-6d85e045a728	00000000-0000-0000-0000-000000000001	VV8	Vidro Verde/Fumê 8mm	m²	315.07	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
07671fb9-a4e4-45f8-8f21-99a0e2264c6c	00000000-0000-0000-0000-000000000001	VV10	Vidro Verde/Fumê 10mm	m²	54.79	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
f5678f24-99a0-421d-9f56-6bdf27da440f	00000000-0000-0000-0000-000000000001	VC6	Vidro Comum 6mm	m²	198.63	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
20507be9-5caa-4eb1-968f-43edab137c9b	00000000-0000-0000-0000-000000000001	VPGV	Vidro Pivotante Verde G.	m²	376.71	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
8da214a9-8fd9-41da-9c9e-136908d50845	00000000-0000-0000-0000-000000000001	VPGI	Vidro Pivotante Incolor G.	m²	342.47	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
ef19fbe7-ff98-4de3-ad44-009526cc08b5	00000000-0000-0000-0000-000000000001	BVF	Vidro Box Verde/Fumê	m²	280.82	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
5f6e23a7-b45d-47a9-ac03-a34aa00e6d44	00000000-0000-0000-0000-000000000001	BI	Box Incolor	m²	239.73	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
69612415-72eb-47e8-9e3f-603046ef95fd	00000000-0000-0000-0000-000000000001	VCR4	Vidro Reflect Bronze 4mm	m²	374.60	0.0600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	00000000-0000-0000-0000-000000000001	KA	Kit Alumínio	und	58.22	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
c3e82167-d8b8-40f4-afe0-ef4d4f520ea5	00000000-0000-0000-0000-000000000001	KAE	Kit Alumínio Externo	und	82.19	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
19180387-3c79-4e64-b538-905b4490d1bf	00000000-0000-0000-0000-000000000001	KAB	Kit Acessório Box	und	20.55	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
ed860c7a-bf70-4ccc-9591-5893ae0647ff	00000000-0000-0000-0000-000000000001	KP	Kit Pivotante	und	37.67	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
e8790ff4-a44f-42ee-8573-09c9275c86bf	00000000-0000-0000-0000-000000000001	KPP	Kit Porta Pivotante	und	54.79	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
e3264338-3c94-406a-a875-8afc9d4480c7	00000000-0000-0000-0000-000000000001	KB	Kit Basculante	und	41.10	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
6b016c9a-3bdc-4c25-9b0c-387d45513941	00000000-0000-0000-0000-000000000001	KF	Kit Ferragem Porta Correr	und	47.95	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
d4db97ff-4faa-47ae-97c9-4e2de8f8f56c	00000000-0000-0000-0000-000000000001	KJ	Kit Alumínio Janela	und	58.22	0.4600	kit	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
937b21c5-0139-40c7-8ebf-3a39e9e11d54	00000000-0000-0000-0000-000000000001	PX40	Puxador Inox 40cm	und	34.25	0.4600	ferragem	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
35ce8183-6427-4698-9099-4a121eb3229a	00000000-0000-0000-0000-000000000001	FVA	Fechadura Porta Correr VA	und	47.95	0.4600	ferragem	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
d7ef68c7-568a-4add-9eb1-a45ef9051489	00000000-0000-0000-0000-000000000001	FVV	Fechadura Porta Correr VV	und	54.79	0.4600	ferragem	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
e54d7c2f-c2e1-4091-857e-d1d2c64c6a70	00000000-0000-0000-0000-000000000001	FX	Fixador Porta Pivotante	und	27.40	0.4600	ferragem	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
52b38c35-e4a1-46f1-a8d7-ac307131c194	00000000-0000-0000-0000-000000000001	BPC	Batedor Porta de Correr	und	37.67	0.4600	ferragem	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
cb343a39-f3b0-452f-b847-03c33e8da0c1	00000000-0000-0000-0000-000000000001	JAT	Jateado	m²	58.22	0.4600	ferragem	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
fa13d5d4-6248-44e3-b3d7-9b34ee0d23f8	00000000-0000-0000-0000-000000000001	FPV	Fecha Pia Vidro	m²	363.01	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
cfe54c78-3b63-4c9b-9358-d5f2b2cea321	00000000-0000-0000-0000-000000000001	FV	Fechamento em Vidro	m²	356.16	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
d2ff6101-8841-445f-a5e8-abab1e770803	00000000-0000-0000-0000-000000000001	VFI	Vidro Fixo Incolor 8mm	m²	263.70	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	\N	\N	\N	5102	UN	0
f3cbc2d8-778a-4ca3-a2ca-cbd21b31ee10	00000000-0000-0000-0000-000000000001	VC4	Vidro Comum 4mm	m²	171.23	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
1bab7f7d-2d05-4a90-9882-6fe057ee4344	00000000-0000-0000-0000-000000000001	EB4	Espelho Bisotado 4mm	m²	410.96	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
6abb6afc-11ee-47e6-94ff-01c9958fc9a9	00000000-0000-0000-0000-000000000001	EC4	Espelho Comum 4mm	m²	263.70	0.4600	vidro	t	2026-05-19 22:26:55.52118+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
c99d865e-6488-45f6-a3ff-6acd3796b1c6	00000000-0000-0000-0000-000000000001	FPA	Fecha Pia Acrilico	m²	273.97	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
d32ca098-5e1b-4de5-b19a-75fe7079359d	00000000-0000-0000-0000-000000000001	VFV	Vidro Fixo Verde/Fumê 8mm	m²	308.22	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
f7d73fa2-9b7d-4094-93fd-7857a605fe09	00000000-0000-0000-0000-000000000001	PBPV	Vitrô Piv./Basc. Verde 8mm	m²	493.15	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
97986e46-4190-4e4b-9923-61e3e299e9f3	00000000-0000-0000-0000-000000000001	PBPI	Vitrô Piv./Basc. Incolor 8mm	m²	465.75	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
ed6e359e-e64e-44c3-b709-6181f567b3f8	00000000-0000-0000-0000-000000000001	FP	Fecha Pia	m²	315.07	0.4600	servico	t	2026-05-20 00:00:50.444121+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
e7386978-d21d-4324-b953-99b1d84a1ca0	00000000-0000-0000-0000-000000000001	JVF8	Janela Verde / Fumê 8MM	m²	226.03	0.4600	vidro	t	2026-05-20 00:00:50.444121+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
8a53fdda-cd7b-4e6d-906f-a70bda2c5e19	00000000-0000-0000-0000-000000000001	JI8	Janela Incolor 8mm	m²	205.48	0.4600	vidro	t	2026-05-20 00:00:50.444121+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
9e46d0ed-b9c7-481a-b4b0-fe54e8e91b25	00000000-0000-0000-0000-000000000001	VBV	Vidro Box Verde / Fumê	m²	280.82	0.4600	vidro	t	2026-05-20 00:00:50.444121+00	2026-05-20 00:00:50.444121+00	\N	\N	\N	5102	UN	0
19d9e598-cdac-4a49-8e16-d1a1862344ed	00000000-0000-0000-0000-000000000001	LAP	Lapidação	und	15.00	0.0000	processamento	t	2026-05-25 20:09:53.216572+00	2026-05-25 20:09:53.216572+00	\N	\N	\N	5102	UN	0
92ae3b4a-0121-493f-ada4-0c0ea5c9a961	00000000-0000-0000-0000-000000000001	BST	Bisotê	und	25.00	0.0000	processamento	t	2026-05-25 20:09:53.498405+00	2026-05-25 20:09:53.498405+00	\N	\N	\N	5102	UN	0
682a27c7-58b5-40cc-b2ba-43ead434010a	00000000-0000-0000-0000-000000000001	FUR	Furação simples	und	20.00	0.0000	processamento	t	2026-05-25 20:09:53.755588+00	2026-05-25 20:09:53.755588+00	\N	\N	\N	5102	UN	0
786025ef-0bdc-4c62-9e3a-ace8a5caa84c	00000000-0000-0000-0000-000000000001	BFJ	Bate Fecha Janela	und	13.70	0.4600	ferragem	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	02419685-215e-45c3-ae7b-8fe218284b22	\N	\N	5102	UN	0
373852c9-f5a3-4599-a47c-3d8d28b3e26b	00000000-0000-0000-0000-000000000001	AD	Adesivo	m²	34.25	0.4600	servico	t	2026-05-19 22:26:55.52118+00	2026-05-19 22:26:55.52118+00	0ca664fa-a0c4-4001-b869-9a98d5f8e420	\N	\N	5102	UN	0
\.


--
-- Data for Name: estoque_itens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."estoque_itens" ("id", "empresa_id", "codigo", "descricao", "categoria", "unidade", "quantidade", "estoque_minimo", "custo_unitario", "created_at", "updated_at", "deleted_at", "produto_id") FROM stdin;
bf0f2c9c-3032-4b3a-bae7-8edafd938ef2	00000000-0000-0000-0000-000000000001	FVV	Fechadura Porta Correr VV	Ferragens	und	100.000	10.000	54.79	2026-06-20 16:58:06.541991+00	2026-06-20 16:59:47.410045+00	\N	d7ef68c7-568a-4add-9eb1-a45ef9051489
f5d2c84a-f796-4ffa-b8ec-71b92319c167	00000000-0000-0000-0000-000000000001	FVA	Fechadura Porta Correr VA	Ferragens	und	100.000	15.000	47.95	2026-05-28 18:23:27.859357+00	2026-06-20 16:59:47.410045+00	\N	35ce8183-6427-4698-9099-4a121eb3229a
6cc40af6-1c7a-4a3a-856a-c03bc1d37d13	00000000-0000-0000-0000-000000000001	AD	Adesivo	Outros		150.000	10.000	34.25	2026-05-28 18:27:46.34527+00	2026-06-20 16:59:47.410045+00	\N	373852c9-f5a3-4599-a47c-3d8d28b3e26b
14c6e530-a1d6-4396-a58b-c3bb7f94483a	00000000-0000-0000-0000-000000000001	VI6	Vidro Incolor 6mm	Chapas	m²	100.000	10.000	136.99	2026-06-20 16:57:50.296881+00	2026-06-20 16:59:47.410045+00	\N	344aee6d-d7c6-4482-9d06-eb0a514c4f7a
9857fbeb-1b7c-4802-861d-b945f596bdb5	00000000-0000-0000-0000-000000000001	VI8	Vidro Incolor 8mm	Chapas	m²	100.000	10.000	246.58	2026-06-20 16:57:51.100144+00	2026-06-20 16:59:47.410045+00	\N	1d8a5fcf-87e2-4be7-8ca2-d00b43d310de
e1dafc56-ab56-4bcb-a090-557ac78d117a	00000000-0000-0000-0000-000000000001	VI10	Vidro Incolor 10mm	Chapas	m²	100.000	10.000	321.92	2026-06-20 16:57:51.856864+00	2026-06-20 16:59:47.410045+00	\N	50e18f84-e1a4-41d4-a7fd-862030919800
0b9ab2ef-ee23-420f-bb7b-6d9a6f33bb0b	00000000-0000-0000-0000-000000000001	VV8	Vidro Verde/Fumê 8mm	Chapas	m²	100.000	10.000	315.07	2026-06-20 16:57:52.637037+00	2026-06-20 16:59:47.410045+00	\N	fd4fcbf7-85ed-4c17-b7a3-6d85e045a728
fc6bb246-25e1-415f-9f32-26f8870a48dc	00000000-0000-0000-0000-000000000001	VV10	Vidro Verde/Fumê 10mm	Chapas	m²	100.000	10.000	54.79	2026-06-20 16:57:53.390575+00	2026-06-20 16:59:47.410045+00	\N	07671fb9-a4e4-45f8-8f21-99a0e2264c6c
4dc4ca55-9447-4e42-be79-bd291c775fe2	00000000-0000-0000-0000-000000000001	VC6	Vidro Comum 6mm	Chapas	m²	100.000	10.000	198.63	2026-06-20 16:57:54.15911+00	2026-06-20 16:59:47.410045+00	\N	f5678f24-99a0-421d-9f56-6bdf27da440f
b57a6fd8-b04e-4674-9987-6498df6513e7	00000000-0000-0000-0000-000000000001	VPGV	Vidro Pivotante Verde G.	Chapas	m²	100.000	10.000	376.71	2026-06-20 16:57:54.936049+00	2026-06-20 16:59:47.410045+00	\N	20507be9-5caa-4eb1-968f-43edab137c9b
369fec95-2ad7-427b-b069-54a9e9312dbe	00000000-0000-0000-0000-000000000001	VPGI	Vidro Pivotante Incolor G.	Chapas	m²	100.000	10.000	342.47	2026-06-20 16:57:55.698631+00	2026-06-20 16:59:47.410045+00	\N	8da214a9-8fd9-41da-9c9e-136908d50845
e1f48006-6a6e-47bb-8045-c477e870b4e4	00000000-0000-0000-0000-000000000001	BVF	Vidro Box Verde/Fumê	Chapas	m²	100.000	10.000	280.82	2026-06-20 16:57:56.470697+00	2026-06-20 16:59:47.410045+00	\N	ef19fbe7-ff98-4de3-ad44-009526cc08b5
dd67edf7-1dd2-423e-a708-e1d18a702787	00000000-0000-0000-0000-000000000001	BI	Box Incolor	Chapas	m²	100.000	10.000	239.73	2026-06-20 16:57:57.217285+00	2026-06-20 16:59:47.410045+00	\N	5f6e23a7-b45d-47a9-ac03-a34aa00e6d44
3d1b0651-6a80-45bd-bf18-a2948ea7f9f3	00000000-0000-0000-0000-000000000001	VCR4	Vidro Reflect Bronze 4mm	Chapas	m²	100.000	10.000	374.60	2026-06-20 16:57:57.98227+00	2026-06-20 16:59:47.410045+00	\N	69612415-72eb-47e8-9e3f-603046ef95fd
78c16bd2-bdaa-451f-8aba-89f0cad8b2a6	00000000-0000-0000-0000-000000000001	KA	Kit Alumínio	Outros	und	100.000	10.000	58.22	2026-06-20 16:57:58.744656+00	2026-06-20 16:59:47.410045+00	\N	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3
d5e88d0e-f568-4b99-892d-06d9728e13cc	00000000-0000-0000-0000-000000000001	KAE	Kit Alumínio Externo	Outros	und	100.000	10.000	82.19	2026-06-20 16:57:59.511214+00	2026-06-20 16:59:47.410045+00	\N	c3e82167-d8b8-40f4-afe0-ef4d4f520ea5
d0cc3aac-9ab3-4daa-ac4c-b4d792706037	00000000-0000-0000-0000-000000000001	KAB	Kit Acessório Box	Outros	und	100.000	10.000	20.55	2026-06-20 16:58:00.291172+00	2026-06-20 16:59:47.410045+00	\N	19180387-3c79-4e64-b538-905b4490d1bf
1b00cd6b-1d41-4e49-ab95-0b8d6570bfd5	00000000-0000-0000-0000-000000000001	KP	Kit Pivotante	Outros	und	100.000	10.000	37.67	2026-06-20 16:58:01.066531+00	2026-06-20 16:59:47.410045+00	\N	ed860c7a-bf70-4ccc-9591-5893ae0647ff
10029c41-1984-4c7c-b7f3-b286f2d3ff24	00000000-0000-0000-0000-000000000001	KPP	Kit Porta Pivotante	Outros	und	100.000	10.000	54.79	2026-06-20 16:58:01.849999+00	2026-06-20 16:59:47.410045+00	\N	e8790ff4-a44f-42ee-8573-09c9275c86bf
e8515e9a-31d2-4ab8-8be1-c9da413435cb	00000000-0000-0000-0000-000000000001	KB	Kit Basculante	Outros	und	100.000	10.000	41.10	2026-06-20 16:58:02.727234+00	2026-06-20 16:59:47.410045+00	\N	e3264338-3c94-406a-a875-8afc9d4480c7
9c41ea73-8582-4cc4-b0ab-956056bcd624	00000000-0000-0000-0000-000000000001	KF	Kit Ferragem Porta Correr	Outros	und	100.000	10.000	47.95	2026-06-20 16:58:03.494042+00	2026-06-20 16:59:47.410045+00	\N	6b016c9a-3bdc-4c25-9b0c-387d45513941
3ebee1ab-193c-4aef-b109-8b5af7cc5a89	00000000-0000-0000-0000-000000000001	KJ	Kit Alumínio Janela	Outros	und	100.000	10.000	58.22	2026-06-20 16:58:04.259924+00	2026-06-20 16:59:47.410045+00	\N	d4db97ff-4faa-47ae-97c9-4e2de8f8f56c
3817d2ba-e7b8-44e0-90ff-f1d2028f282f	00000000-0000-0000-0000-000000000001	PX40	Puxador Inox 40cm	Ferragens	und	100.000	10.000	34.25	2026-06-20 16:58:05.008151+00	2026-06-20 16:59:47.410045+00	\N	937b21c5-0139-40c7-8ebf-3a39e9e11d54
1c3cd942-fd47-4a8b-9f9a-4562cd0a3a4c	00000000-0000-0000-0000-000000000001	FX	Fixador Porta Pivotante	Ferragens	und	100.000	10.000	27.40	2026-06-20 16:58:07.323902+00	2026-06-20 16:59:47.410045+00	\N	e54d7c2f-c2e1-4091-857e-d1d2c64c6a70
3e60d368-56ec-4e8d-90bd-411b0b74ccfa	00000000-0000-0000-0000-000000000001	BPC	Batedor Porta de Correr	Ferragens	und	100.000	10.000	37.67	2026-06-20 16:58:08.103414+00	2026-06-20 16:59:47.410045+00	\N	52b38c35-e4a1-46f1-a8d7-ac307131c194
032d5d37-faea-490e-a68d-b067c2d8171f	00000000-0000-0000-0000-000000000001	JAT	Jateado	Ferragens	m²	100.000	10.000	58.22	2026-06-20 16:58:08.877803+00	2026-06-20 16:59:47.410045+00	\N	cb343a39-f3b0-452f-b847-03c33e8da0c1
9ee9bee7-7ffd-4c39-a409-f6dce735f44b	00000000-0000-0000-0000-000000000001	VC4	Vidro Comum 4mm	Chapas	m²	100.000	10.000	171.23	2026-06-20 16:58:09.653408+00	2026-06-20 16:59:47.410045+00	\N	f3cbc2d8-778a-4ca3-a2ca-cbd21b31ee10
5b52cc13-035b-4461-8741-dbef02223fff	00000000-0000-0000-0000-000000000001	EB4	Espelho Bisotado 4mm	Chapas	m²	100.000	10.000	410.96	2026-06-20 16:58:10.433679+00	2026-06-20 16:59:47.410045+00	\N	1bab7f7d-2d05-4a90-9882-6fe057ee4344
1d417caf-d27c-41bf-b6d4-92fb66f65377	00000000-0000-0000-0000-000000000001	EC4	Espelho Comum 4mm	Chapas	m²	100.000	10.000	263.70	2026-06-20 16:58:11.208604+00	2026-06-20 16:59:47.410045+00	\N	6abb6afc-11ee-47e6-94ff-01c9958fc9a9
80fc01ac-1a54-4b2d-a92d-98b8e1ddc360	00000000-0000-0000-0000-000000000001	JI8	Janela Incolor 8mm	Chapas	m²	100.000	10.000	205.48	2026-06-20 16:58:12.754199+00	2026-06-20 16:59:47.410045+00	\N	8a53fdda-cd7b-4e6d-906f-a70bda2c5e19
0a74953e-9fef-44bc-9146-5e07f9a8b853	00000000-0000-0000-0000-000000000001	VBV	Vidro Box Verde / Fumê	Chapas	m²	100.000	10.000	280.82	2026-06-20 16:58:13.541895+00	2026-06-20 16:59:47.410045+00	\N	9e46d0ed-b9c7-481a-b4b0-fe54e8e91b25
0c8f67c0-e7d0-460d-a1e2-b20f02fc51f4	00000000-0000-0000-0000-000000000001	BFJ	Bate Fecha Janela	Ferragens	und	100.000	10.000	13.70	2026-06-20 16:58:14.342947+00	2026-06-20 16:59:47.410045+00	\N	786025ef-0bdc-4c62-9e3a-ace8a5caa84c
70f51dff-8f49-4121-97c9-e3a94a3fbc8e	00000000-0000-0000-0000-000000000001	JVF8	Janela Verde / Fumê 8MM	Chapas	m²	100.000	10.000	226.03	2026-06-20 16:58:11.982486+00	2026-06-30 22:35:57.952476+00	\N	e7386978-d21d-4324-b953-99b1d84a1ca0
\.


--
-- Data for Name: estoque_movimentacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."estoque_movimentacoes" ("id", "empresa_id", "item_id", "tipo", "quantidade", "os_referencia", "observacao", "usuario_id", "created_at", "orcamento_id") FROM stdin;
6bef7b5f-6ff5-4dc6-a83a-73119bed4f43	00000000-0000-0000-0000-000000000001	6cc40af6-1c7a-4a3a-856a-c03bc1d37d13	Saída	50.000	\N	\N	\N	2026-05-28 18:31:24.766236+00	\N
fb1a6080-4c07-45a4-bbb4-2f5371f87219	00000000-0000-0000-0000-000000000001	6cc40af6-1c7a-4a3a-856a-c03bc1d37d13	Entrada	50.000	\N	Adicionado 50  via script de carga inicial	\N	2026-06-20 16:56:00.201859+00	\N
dbc93a0a-edd3-4c71-b4dc-1a5c34057367	00000000-0000-0000-0000-000000000001	14c6e530-a1d6-4396-a58b-c3bb7f94483a	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:50.828468+00	\N
903632dc-95db-4c21-8a77-71220fa8b68d	00000000-0000-0000-0000-000000000001	9857fbeb-1b7c-4802-861d-b945f596bdb5	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:51.613861+00	\N
0ca146e2-6b37-4675-9e26-9c33c56c8e35	00000000-0000-0000-0000-000000000001	e1dafc56-ab56-4bcb-a090-557ac78d117a	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:52.368552+00	\N
98fa8844-45bc-4c4b-88a0-3a419911d3d9	00000000-0000-0000-0000-000000000001	0b9ab2ef-ee23-420f-bb7b-6d9a6f33bb0b	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:53.146115+00	\N
3a60464b-23f5-4559-bf5d-ec838f83ce6f	00000000-0000-0000-0000-000000000001	fc6bb246-25e1-415f-9f32-26f8870a48dc	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:53.892593+00	\N
ae813bff-f30a-49eb-864a-0499529f5806	00000000-0000-0000-0000-000000000001	4dc4ca55-9447-4e42-be79-bd291c775fe2	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:54.695248+00	\N
fb633aa8-b7fa-4170-9b83-410ad6b215db	00000000-0000-0000-0000-000000000001	b57a6fd8-b04e-4674-9987-6498df6513e7	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:55.450356+00	\N
7a2e625c-ef1c-414f-b7b9-26d07cf0a955	00000000-0000-0000-0000-000000000001	369fec95-2ad7-427b-b069-54a9e9312dbe	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:56.204862+00	\N
147cb0bf-da9d-4139-8fc4-f9e73d41bfae	00000000-0000-0000-0000-000000000001	e1f48006-6a6e-47bb-8045-c477e870b4e4	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:56.975239+00	\N
308545ec-63d0-49cc-a9da-7703aef5335f	00000000-0000-0000-0000-000000000001	dd67edf7-1dd2-423e-a708-e1d18a702787	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:57.741655+00	\N
fc19ecc4-b1eb-4f23-9891-531f7ff78787	00000000-0000-0000-0000-000000000001	3d1b0651-6a80-45bd-bf18-a2948ea7f9f3	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:58.504432+00	\N
3d8af304-9491-4aa6-8e2b-035843bfd9c6	00000000-0000-0000-0000-000000000001	78c16bd2-bdaa-451f-8aba-89f0cad8b2a6	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:57:59.268599+00	\N
20e6b352-5667-4293-82a3-59eb0e863fdd	00000000-0000-0000-0000-000000000001	d5e88d0e-f568-4b99-892d-06d9728e13cc	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:00.039429+00	\N
1984a1ab-e3b5-4177-a911-c92e2536f652	00000000-0000-0000-0000-000000000001	d0cc3aac-9ab3-4daa-ac4c-b4d792706037	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:00.813477+00	\N
4274e358-8927-4eaa-a710-e29dac1ddf17	00000000-0000-0000-0000-000000000001	1b00cd6b-1d41-4e49-ab95-0b8d6570bfd5	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:01.58206+00	\N
bc5c9330-08d7-4483-9796-0e49c4c0c8d0	00000000-0000-0000-0000-000000000001	10029c41-1984-4c7c-b7f3-b286f2d3ff24	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:02.475435+00	\N
7c3a439b-f702-4dbf-bf2d-13a38b5eb0a8	00000000-0000-0000-0000-000000000001	e8515e9a-31d2-4ab8-8be1-c9da413435cb	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:03.254213+00	\N
30f14070-1df1-4657-9c95-f83a8d0b9e20	00000000-0000-0000-0000-000000000001	9c41ea73-8582-4cc4-b0ab-956056bcd624	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:03.995381+00	\N
54aef62c-b9ca-44cf-b399-10dd506536db	00000000-0000-0000-0000-000000000001	3ebee1ab-193c-4aef-b109-8b5af7cc5a89	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:04.76565+00	\N
4e5c3e39-9c65-4bda-95ce-9a6fbe513365	00000000-0000-0000-0000-000000000001	3817d2ba-e7b8-44e0-90ff-f1d2028f282f	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:05.50974+00	\N
1ed0089f-8bab-4d12-863f-0848715d7667	00000000-0000-0000-0000-000000000001	f5d2c84a-f796-4ffa-b8ec-71b92319c167	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:06.273422+00	\N
335da788-54c8-4995-9c8b-69c5efae219e	00000000-0000-0000-0000-000000000001	bf0f2c9c-3032-4b3a-bae7-8edafd938ef2	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:07.073311+00	\N
c760f0fd-98ff-46cc-a362-f0b9ab1a82ad	00000000-0000-0000-0000-000000000001	1c3cd942-fd47-4a8b-9f9a-4562cd0a3a4c	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:07.825923+00	\N
d06690e2-4e9d-4722-9bab-aae8b2c1ecc4	00000000-0000-0000-0000-000000000001	3e60d368-56ec-4e8d-90bd-411b0b74ccfa	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:08.599753+00	\N
b605de67-0eac-492e-a5a3-18f9d58369fe	00000000-0000-0000-0000-000000000001	032d5d37-faea-490e-a68d-b067c2d8171f	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:09.373314+00	\N
b1e90276-2bf3-4162-bf7b-d9a0bd2db50b	00000000-0000-0000-0000-000000000001	9ee9bee7-7ffd-4c39-a409-f6dce735f44b	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:10.18345+00	\N
bf169c6f-7f24-46e1-8b5e-2e0061f85564	00000000-0000-0000-0000-000000000001	5b52cc13-035b-4461-8741-dbef02223fff	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:10.947903+00	\N
6152b76f-46c6-452b-9418-42769efccea7	00000000-0000-0000-0000-000000000001	1d417caf-d27c-41bf-b6d4-92fb66f65377	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:11.732183+00	\N
b5edcf13-41d9-4f6d-874d-7ec47d6835eb	00000000-0000-0000-0000-000000000001	70f51dff-8f49-4121-97c9-e3a94a3fbc8e	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:12.497228+00	\N
0fe171eb-9d78-49a5-93f2-9b5258698c7f	00000000-0000-0000-0000-000000000001	80fc01ac-1a54-4b2d-a92d-98b8e1ddc360	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:13.267079+00	\N
f2eaf028-3de0-494c-a912-fb34d29e0677	00000000-0000-0000-0000-000000000001	0a74953e-9fef-44bc-9146-5e07f9a8b853	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:14.091096+00	\N
0d440293-54c7-4129-9133-8f10159127e9	00000000-0000-0000-0000-000000000001	0c8f67c0-e7d0-460d-a1e2-b20f02fc51f4	Entrada	50.000	\N	Adicionado 50 via script de carga inicial	\N	2026-06-20 16:58:14.856917+00	\N
876188f6-bf01-4355-9cbd-1f82d1edcc71	00000000-0000-0000-0000-000000000001	f5d2c84a-f796-4ffa-b8ec-71b92319c167	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
597be11f-fd2d-4dc8-bbed-52d118683216	00000000-0000-0000-0000-000000000001	bf0f2c9c-3032-4b3a-bae7-8edafd938ef2	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
8150c3aa-2cdf-4cb2-9474-57a7878e1764	00000000-0000-0000-0000-000000000001	6cc40af6-1c7a-4a3a-856a-c03bc1d37d13	Entrada	50.000	\N	Adicionado 50  via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
6c7cb2e2-172c-47dc-bc8a-544a6140fc14	00000000-0000-0000-0000-000000000001	14c6e530-a1d6-4396-a58b-c3bb7f94483a	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
b64522a4-10e3-41fc-a627-5c601b9cd42c	00000000-0000-0000-0000-000000000001	9857fbeb-1b7c-4802-861d-b945f596bdb5	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
ea426e19-409e-4c12-97af-88edf293b563	00000000-0000-0000-0000-000000000001	e1dafc56-ab56-4bcb-a090-557ac78d117a	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
d8f4105d-3fd7-4ed4-acd2-e3e591c8d4fa	00000000-0000-0000-0000-000000000001	0b9ab2ef-ee23-420f-bb7b-6d9a6f33bb0b	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
ce50c9a1-9ae5-46d1-b678-51bbdcd5174e	00000000-0000-0000-0000-000000000001	fc6bb246-25e1-415f-9f32-26f8870a48dc	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
799d5fc2-6586-4400-b988-aacdb5b656bd	00000000-0000-0000-0000-000000000001	4dc4ca55-9447-4e42-be79-bd291c775fe2	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
75810b92-10b3-45a0-aa14-e9bb7c55a091	00000000-0000-0000-0000-000000000001	b57a6fd8-b04e-4674-9987-6498df6513e7	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
36a192c3-bcbe-4570-b609-6f8d3af724bd	00000000-0000-0000-0000-000000000001	369fec95-2ad7-427b-b069-54a9e9312dbe	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
73670302-5c94-4d23-9e4b-d809865eeb73	00000000-0000-0000-0000-000000000001	e1f48006-6a6e-47bb-8045-c477e870b4e4	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
55d560be-4395-45ad-981a-d6aed292d11b	00000000-0000-0000-0000-000000000001	dd67edf7-1dd2-423e-a708-e1d18a702787	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
37ebc088-f976-4d0a-b4ab-9cfc3cad288f	00000000-0000-0000-0000-000000000001	3d1b0651-6a80-45bd-bf18-a2948ea7f9f3	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
5c21b5c3-3e40-46b6-9fa0-fb336e65f370	00000000-0000-0000-0000-000000000001	78c16bd2-bdaa-451f-8aba-89f0cad8b2a6	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
75618f3f-90e5-42b6-93bf-cd68a8a9815a	00000000-0000-0000-0000-000000000001	d5e88d0e-f568-4b99-892d-06d9728e13cc	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
99ef0b32-71c7-4612-a762-485e7735c3e0	00000000-0000-0000-0000-000000000001	d0cc3aac-9ab3-4daa-ac4c-b4d792706037	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
5fdee018-0657-4928-992c-4543d336b6f5	00000000-0000-0000-0000-000000000001	1b00cd6b-1d41-4e49-ab95-0b8d6570bfd5	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
773e0eae-5ea5-4e83-b689-b9e44f2e6748	00000000-0000-0000-0000-000000000001	10029c41-1984-4c7c-b7f3-b286f2d3ff24	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
321b2790-b806-4c58-8457-33266cf914a5	00000000-0000-0000-0000-000000000001	e8515e9a-31d2-4ab8-8be1-c9da413435cb	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
50ec18e6-59db-454e-839c-bdb958f24860	00000000-0000-0000-0000-000000000001	9c41ea73-8582-4cc4-b0ab-956056bcd624	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
7c3da48e-8737-4221-91cc-ed50d28de812	00000000-0000-0000-0000-000000000001	3ebee1ab-193c-4aef-b109-8b5af7cc5a89	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
9961df1a-f47d-412c-99c6-69fca1428a66	00000000-0000-0000-0000-000000000001	3817d2ba-e7b8-44e0-90ff-f1d2028f282f	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
46a56628-5946-463d-8be8-5848a3b7c589	00000000-0000-0000-0000-000000000001	1c3cd942-fd47-4a8b-9f9a-4562cd0a3a4c	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
3c909b18-c6e9-438a-8cfb-de8c925eea30	00000000-0000-0000-0000-000000000001	3e60d368-56ec-4e8d-90bd-411b0b74ccfa	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
9f5edc76-0b4a-49c4-bf38-3c061327e234	00000000-0000-0000-0000-000000000001	032d5d37-faea-490e-a68d-b067c2d8171f	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
0ccfd44c-9af9-4c80-99fa-66bb1eeb5fcc	00000000-0000-0000-0000-000000000001	9ee9bee7-7ffd-4c39-a409-f6dce735f44b	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
05d7a657-0def-4514-98bf-42e9da3e67eb	00000000-0000-0000-0000-000000000001	5b52cc13-035b-4461-8741-dbef02223fff	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
82177c89-53af-40ef-af59-b83a54eba657	00000000-0000-0000-0000-000000000001	1d417caf-d27c-41bf-b6d4-92fb66f65377	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
0b850b96-3940-46b8-82cf-e7610975ea9c	00000000-0000-0000-0000-000000000001	70f51dff-8f49-4121-97c9-e3a94a3fbc8e	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
e0fcb17a-822f-4ea0-ae05-8d63f3d981e1	00000000-0000-0000-0000-000000000001	80fc01ac-1a54-4b2d-a92d-98b8e1ddc360	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
5408ab51-1508-4438-8340-4c9ccb6f7617	00000000-0000-0000-0000-000000000001	0a74953e-9fef-44bc-9146-5e07f9a8b853	Entrada	50.000	\N	Adicionado 50 m² via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
467abed3-ad5a-40ef-ae27-0740044277ce	00000000-0000-0000-0000-000000000001	0c8f67c0-e7d0-460d-a1e2-b20f02fc51f4	Entrada	50.000	\N	Adicionado 50 und via script de carga inicial	\N	2026-06-20 16:59:47.410045+00	\N
385bb6ec-a093-439f-82bb-5482fbba3c66	00000000-0000-0000-0000-000000000001	70f51dff-8f49-4121-97c9-e3a94a3fbc8e	Saída	1.000	ORC-1529	Baixa automática — JVF8	\N	2026-06-30 22:35:16.499911+00	1aca483e-3ac8-4097-81d7-e1ab3d08dacd
fb9bbde3-92e4-4c22-9535-3f6cbb850d84	00000000-0000-0000-0000-000000000001	70f51dff-8f49-4121-97c9-e3a94a3fbc8e	Devolução	1.000	ORC-1529	Devolução automática — produção cancelada	\N	2026-06-30 22:35:57.952476+00	1aca483e-3ac8-4097-81d7-e1ab3d08dacd
\.


--
-- Data for Name: logs_auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."logs_auditoria" ("id", "usuario_id", "empresa_id", "acao", "severidade", "detalhes", "ip_origem", "created_at") FROM stdin;
\.


--
-- Data for Name: nfe_entrada; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."nfe_entrada" ("id", "empresa_id", "fornecedor_id", "fornecedor_nome", "numero", "serie", "chave_acesso", "data_emissao", "valor_total", "pedido_compra_id", "status_sped", "xml_url", "dados_xml", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: nfe_saida; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."nfe_saida" ("id", "empresa_id", "os_id", "numero", "serie", "chave_acesso", "valor_total", "status", "xml_path", "criado_em", "atualizado_em", "email_enviado", "email_enviado_em", "cliente_nome", "cliente_documento", "valor_impostos", "itens", "cliente_email", "protocolo_autorizacao", "xml_autorizado", "xml_cancelamento", "focus_nfe_ref", "danfe_url", "data_autorizacao", "motivo_rejeicao", "forma_pagamento", "descricao_itens", "modalidade_frete") FROM stdin;
\.


--
-- Data for Name: obrigacoes_fiscais; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."obrigacoes_fiscais" ("id", "empresa_id", "tipo", "competencia", "data_vencimento", "valor", "status", "data_pagamento", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: pedidos_compra_etapas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pedidos_compra_etapas" ("id", "pedido_id", "etapa", "data_hora", "usuario_id", "usuario_nome", "observacao") FROM stdin;
\.


--
-- Data for Name: pedidos_compra_itens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pedidos_compra_itens" ("id", "pedido_id", "produto", "projeto_vinculado", "os_vinculada", "largura_mm", "altura_mm", "quantidade", "m2_calculado", "preco_m2", "total", "produto_id", "quantidade_recebida", "preco_unitario") FROM stdin;
\.


--
-- Data for Name: representantes_comerciais; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."representantes_comerciais" ("id", "empresa_id", "fornecedor_id", "nome", "telefone", "email", "regiao", "observacoes", "ativo", "criado_em") FROM stdin;
\.


--
-- Data for Name: romaneios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."romaneios" ("id", "empresa_id", "pedido_compra_id", "numero_nfe", "numero_oe", "data_emissao", "data_recebimento", "status", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: romaneio_itens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."romaneio_itens" ("id", "romaneio_id", "produto", "espessura_mm", "largura_mm", "altura_mm", "qtd_encomendada", "qtd_recebida", "m2", "peso_kg", "situacao") FROM stdin;
\.


--
-- Data for Name: servicos_compostos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."servicos_compostos" ("id", "empresa_id", "codigo", "nome", "categoria", "created_at") FROM stdin;
cbef2ed7-9e04-4b8c-ac8a-8f62085f8bdc	00000000-0000-0000-0000-000000000001	PPI8	Porta Pivotante Incolor 8mm	porta_pivotante	2026-05-19 22:26:55.52118+00
aac5bcdc-d9c9-4fed-893b-cf41fea388e7	00000000-0000-0000-0000-000000000001	PPV8	Porta Pivotante Verde 8mm	porta_pivotante	2026-05-19 22:26:55.52118+00
c75acb04-2596-471c-8ce2-983654f4400c	00000000-0000-0000-0000-000000000001	PP2V8	Porta Pivotante 2 Folhas Verde 8mm	porta_pivotante	2026-05-19 22:26:55.52118+00
e29ae2a4-9833-4ff2-add3-11336bdfdcc4	00000000-0000-0000-0000-000000000001	PPI10	Porta Pivotante Incolor 10mm	porta_pivotante	2026-05-19 22:26:55.52118+00
72394dcc-abbb-43fb-8634-e9f0e51cb01c	00000000-0000-0000-0000-000000000001	PCI2	Porta Correr 2 Folhas Incolor 8mm	porta_correr	2026-05-19 22:26:55.52118+00
965c1912-c32a-4f7e-9e0e-bb15c0f1998d	00000000-0000-0000-0000-000000000001	PCV2	Porta Correr 2 Folhas Verde 8mm	porta_correr	2026-05-19 22:26:55.52118+00
ed72fcfe-acb3-446d-b786-fcefe1915c7a	00000000-0000-0000-0000-000000000001	PCI4	Porta Correr 4 Folhas Incolor 8mm	porta_correr	2026-05-19 22:26:55.52118+00
d8354bd7-95c8-4dca-aef4-2e67d387aa84	00000000-0000-0000-0000-000000000001	PCV4	Porta Correr 4 Folhas Verde 8mm	porta_correr	2026-05-19 22:26:55.52118+00
a097394b-4489-4fca-b4e4-22b90f6c793a	00000000-0000-0000-0000-000000000001	PCEI	Porta Correr Externa Incolor 8mm	porta_correr	2026-05-19 22:26:55.52118+00
3f55136f-1fa1-44f1-9e0f-8affe06ed4eb	00000000-0000-0000-0000-000000000001	PCEV	Porta Correr Externa Verde 8mm	porta_correr	2026-05-19 22:26:55.52118+00
ddb80c22-5ed3-4005-b69f-37b1d249f832	00000000-0000-0000-0000-000000000001	JI8	Janela Incolor 8mm	janela	2026-05-19 22:26:55.52118+00
c58b32b2-7a7e-4a61-b333-06a2f92029fc	00000000-0000-0000-0000-000000000001	JV8	Janela Verde/Fumê 8mm	janela	2026-05-19 22:26:55.52118+00
6daa3690-d236-4129-a551-b5c511a4e428	00000000-0000-0000-0000-000000000001	PGV	Pivotante/Basc. Verde	porta_pivotante	2026-05-19 22:26:55.52118+00
f5e97692-61cc-4a20-b73c-c7077802c1bf	00000000-0000-0000-0000-000000000001	PGI	Pivotante/Basc. Incolor	porta_pivotante	2026-05-19 22:26:55.52118+00
3f14581f-bd05-40ea-8cc3-842480541498	00000000-0000-0000-0000-000000000001	BI	Box Incolor 8mm	box	2026-05-19 22:26:55.52118+00
799b2ef3-32ed-4d48-8f65-db461fd4312c	00000000-0000-0000-0000-000000000001	BV	Box Verde/Fumê 8mm	box	2026-05-19 22:26:55.52118+00
a5b1048d-4b87-4f16-9f7c-068df483bc1c	00000000-0000-0000-0000-000000000001	JT	Jateamento	especial	2026-05-19 22:26:55.52118+00
3853b555-2ce7-41a3-a5b1-2ddff50bd49a	00000000-0000-0000-0000-000000000001	PBPV	Vitrô Piv./Basc. Verde 8mm	especial	2026-05-19 22:26:55.52118+00
5a593998-6c8e-4f0d-9fd2-dd8b388f6fd8	00000000-0000-0000-0000-000000000001	PBPI	Vitrô Piv./Basc. Incolor 8mm	especial	2026-05-19 22:26:55.52118+00
b39814ab-e028-4f71-8002-6bce051ffd05	00000000-0000-0000-0000-000000000001	FPA	Fecha Pia Acrilico	especial	2026-05-19 22:26:55.52118+00
53597190-d977-41b3-a7f4-9f937815dd48	00000000-0000-0000-0000-000000000001	FPV	Fecha Pia Vidro	especial	2026-05-19 22:26:55.52118+00
84133103-14aa-4b58-89ec-98cb933f0d82	00000000-0000-0000-0000-000000000001	FV	Fechamento em Vidro	especial	2026-05-19 22:26:55.52118+00
63dbc326-8a48-4d77-a509-8979c570ebe5	00000000-0000-0000-0000-000000000001	VFI	Vidro Fixo/Bandeira Incolor 8mm	especial	2026-05-19 22:26:55.52118+00
2e5dd01f-0132-4218-9de5-7beede374046	00000000-0000-0000-0000-000000000001	VFV	Vidro Fixo/Bandeira Verde 8mm	especial	2026-05-19 22:26:55.52118+00
cd0a91d8-e069-46dc-a51e-c8175d576c2d	00000000-0000-0000-0000-000000000001	VC4	Vidro Comum 4mm	especial	2026-05-19 22:26:55.52118+00
149de49d-57e9-4cfa-afef-3976a7a5ce2c	00000000-0000-0000-0000-000000000001	VC6	Vidro Comum 6mm	especial	2026-05-19 22:26:55.52118+00
6b9981c0-5789-48ef-96dc-29b38d694390	00000000-0000-0000-0000-000000000001	VCR4	Vidro Reflect Bronze 4mm	especial	2026-05-19 22:26:55.52118+00
\.


--
-- Data for Name: servico_componentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."servico_componentes" ("id", "servico_id", "produto_id", "quantidade", "tipo_preco", "ordem") FROM stdin;
0ecbdc27-d167-4412-9f02-4613ab2942dc	cbef2ed7-9e04-4b8c-ac8a-8f62085f8bdc	1d8a5fcf-87e2-4be7-8ca2-d00b43d310de	1.00	M2	1
a2003d2c-e5af-44e9-b3f8-d2b084e29ac6	cbef2ed7-9e04-4b8c-ac8a-8f62085f8bdc	e8790ff4-a44f-42ee-8573-09c9275c86bf	1.00	PC_FX	3
7a9109ee-1a8d-4555-88c7-2c8b2af2d40b	cbef2ed7-9e04-4b8c-ac8a-8f62085f8bdc	937b21c5-0139-40c7-8ebf-3a39e9e11d54	1.00	PC_FX	2
6b6d4d1d-f841-4f54-9709-5f00110f04a5	cbef2ed7-9e04-4b8c-ac8a-8f62085f8bdc	e54d7c2f-c2e1-4091-857e-d1d2c64c6a70	1.00	PC_FX	4
2659bc2c-7c92-44cd-98e5-d16dc865276d	aac5bcdc-d9c9-4fed-893b-cf41fea388e7	fd4fcbf7-85ed-4c17-b7a3-6d85e045a728	1.00	M2	1
672536fe-4603-4fe2-9f53-80da5104883a	aac5bcdc-d9c9-4fed-893b-cf41fea388e7	e8790ff4-a44f-42ee-8573-09c9275c86bf	1.00	PC_FX	3
38f0e408-6032-4bde-85ec-4b4ae13a7088	aac5bcdc-d9c9-4fed-893b-cf41fea388e7	937b21c5-0139-40c7-8ebf-3a39e9e11d54	1.00	PC_FX	2
4fdff7a2-7bc9-46d0-9367-55c6a1f72f8d	aac5bcdc-d9c9-4fed-893b-cf41fea388e7	e54d7c2f-c2e1-4091-857e-d1d2c64c6a70	1.00	PC_FX	4
b87d39b5-66ae-4d7e-817c-331ca8815c57	c75acb04-2596-471c-8ce2-983654f4400c	fd4fcbf7-85ed-4c17-b7a3-6d85e045a728	1.00	M2	1
4a60970c-d7a2-47dd-bbdf-31820869d5be	c75acb04-2596-471c-8ce2-983654f4400c	e8790ff4-a44f-42ee-8573-09c9275c86bf	2.00	PC_FX	3
9ccc3050-0edd-457c-a6f1-9b3d332b258b	c75acb04-2596-471c-8ce2-983654f4400c	937b21c5-0139-40c7-8ebf-3a39e9e11d54	2.00	PC_FX	2
d162597d-3069-4bfd-93ec-4876cab44aa7	e29ae2a4-9833-4ff2-add3-11336bdfdcc4	50e18f84-e1a4-41d4-a7fd-862030919800	1.00	M2	1
8c2e12c2-2ed4-44a4-b1bc-aa0c81b19a5e	e29ae2a4-9833-4ff2-add3-11336bdfdcc4	e8790ff4-a44f-42ee-8573-09c9275c86bf	1.00	PC_FX	3
8909b150-0a51-4488-a3f6-6fd581e52544	e29ae2a4-9833-4ff2-add3-11336bdfdcc4	937b21c5-0139-40c7-8ebf-3a39e9e11d54	1.00	PC_FX	2
c55624db-2cc3-4de9-8740-9f14f24ce138	72394dcc-abbb-43fb-8634-e9f0e51cb01c	1d8a5fcf-87e2-4be7-8ca2-d00b43d310de	1.00	M2	1
8a298505-c1a7-41a8-9c2f-6e8ec49f998c	72394dcc-abbb-43fb-8634-e9f0e51cb01c	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
4bfe03c4-f3f1-49c6-83dc-1f3addaade2a	72394dcc-abbb-43fb-8634-e9f0e51cb01c	937b21c5-0139-40c7-8ebf-3a39e9e11d54	1.00	PC_FX	3
bcd08c9f-289d-4e71-8138-fe9be522f1ce	72394dcc-abbb-43fb-8634-e9f0e51cb01c	35ce8183-6427-4698-9099-4a121eb3229a	1.00	PC_FX	4
faed2c69-3d2e-4295-8957-351e287a4a8a	965c1912-c32a-4f7e-9e0e-bb15c0f1998d	fd4fcbf7-85ed-4c17-b7a3-6d85e045a728	1.00	M2	1
6c43ab0a-bb56-48bd-89e1-e95ee2db2330	965c1912-c32a-4f7e-9e0e-bb15c0f1998d	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
978723a7-3247-4e42-aeb6-57a00065c817	965c1912-c32a-4f7e-9e0e-bb15c0f1998d	937b21c5-0139-40c7-8ebf-3a39e9e11d54	1.00	PC_FX	3
0010a9a5-a9db-4582-8d51-1dff03e3adde	965c1912-c32a-4f7e-9e0e-bb15c0f1998d	35ce8183-6427-4698-9099-4a121eb3229a	1.00	PC_FX	4
de567c2b-f331-4c00-b714-692e756c2015	ed72fcfe-acb3-446d-b786-fcefe1915c7a	1d8a5fcf-87e2-4be7-8ca2-d00b43d310de	1.00	M2	1
5910f69c-0f85-4479-a2f4-3d812e3a1f51	ed72fcfe-acb3-446d-b786-fcefe1915c7a	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
f4919176-f0fd-4b3d-8608-782dc900d9dc	ed72fcfe-acb3-446d-b786-fcefe1915c7a	937b21c5-0139-40c7-8ebf-3a39e9e11d54	2.00	PC_FX	3
4fa8d60a-ea65-4480-bf3a-d7138b166e44	ed72fcfe-acb3-446d-b786-fcefe1915c7a	d7ef68c7-568a-4add-9eb1-a45ef9051489	1.00	PC_FX	4
63459741-26f7-4b65-ad47-52e943d1ff7a	d8354bd7-95c8-4dca-aef4-2e67d387aa84	fd4fcbf7-85ed-4c17-b7a3-6d85e045a728	1.00	M2	1
d5ef36a8-5614-4a15-aefc-15201abd8701	d8354bd7-95c8-4dca-aef4-2e67d387aa84	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
6a934b2c-abe0-4d7e-a34e-e6ee06b88ea8	d8354bd7-95c8-4dca-aef4-2e67d387aa84	937b21c5-0139-40c7-8ebf-3a39e9e11d54	2.00	PC_FX	3
e58b14f4-2390-4a71-9a24-5259c4a45eba	d8354bd7-95c8-4dca-aef4-2e67d387aa84	d7ef68c7-568a-4add-9eb1-a45ef9051489	1.00	PC_FX	4
f2264364-6b75-4d15-96c4-7d83c7b0257c	a097394b-4489-4fca-b4e4-22b90f6c793a	1d8a5fcf-87e2-4be7-8ca2-d00b43d310de	1.00	M2	1
f3a7a069-c143-4009-ae30-6a17e75d48e3	a097394b-4489-4fca-b4e4-22b90f6c793a	937b21c5-0139-40c7-8ebf-3a39e9e11d54	1.00	PC_FX	3
d15a14bd-8c39-4778-bf0d-586a33c119ab	a097394b-4489-4fca-b4e4-22b90f6c793a	35ce8183-6427-4698-9099-4a121eb3229a	1.00	PC_FX	4
c51d287f-a7a2-483a-8827-5b97284bd263	a097394b-4489-4fca-b4e4-22b90f6c793a	52b38c35-e4a1-46f1-a8d7-ac307131c194	1.00	PC_FX	5
2ce1a394-9b29-4210-a837-cb402bd176a5	3f55136f-1fa1-44f1-9e0f-8affe06ed4eb	fd4fcbf7-85ed-4c17-b7a3-6d85e045a728	1.00	M2	1
6d96ef9d-063c-4dde-9f3f-66bf9b17b278	3f55136f-1fa1-44f1-9e0f-8affe06ed4eb	937b21c5-0139-40c7-8ebf-3a39e9e11d54	1.00	PC_FX	3
0a553856-e37d-4ba0-b430-df566f165371	3f55136f-1fa1-44f1-9e0f-8affe06ed4eb	35ce8183-6427-4698-9099-4a121eb3229a	1.00	PC_FX	4
0fa877df-49e4-4058-ab3c-930eedf05e3c	3f55136f-1fa1-44f1-9e0f-8affe06ed4eb	52b38c35-e4a1-46f1-a8d7-ac307131c194	1.00	PC_FX	5
d7938b7f-60c9-417a-85c9-9d16f6a49d6b	ddb80c22-5ed3-4005-b69f-37b1d249f832	1d8a5fcf-87e2-4be7-8ca2-d00b43d310de	1.00	M2	1
900d4e8f-93c5-4796-ae3a-f37b1b04fe7c	ddb80c22-5ed3-4005-b69f-37b1d249f832	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
1330a38d-2c34-4727-9365-a2bad3c05845	ddb80c22-5ed3-4005-b69f-37b1d249f832	786025ef-0bdc-4c62-9e3a-ace8a5caa84c	1.00	PC_FX	3
32af5f15-7ec1-471d-9101-144d85e6b617	c58b32b2-7a7e-4a61-b333-06a2f92029fc	fd4fcbf7-85ed-4c17-b7a3-6d85e045a728	1.00	M2	1
97ebdc63-b566-4c03-bb7a-bad74f512614	c58b32b2-7a7e-4a61-b333-06a2f92029fc	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
429adf45-af63-46a2-b237-ff993a00d99e	c58b32b2-7a7e-4a61-b333-06a2f92029fc	786025ef-0bdc-4c62-9e3a-ace8a5caa84c	1.00	PC_FX	3
5eea3956-5a2f-48e5-b0da-784c84b41ddb	6daa3690-d236-4129-a551-b5c511a4e428	20507be9-5caa-4eb1-968f-43edab137c9b	1.00	M2	1
595ff1d8-83ea-4632-948b-0cbfe54003a0	6daa3690-d236-4129-a551-b5c511a4e428	ed860c7a-bf70-4ccc-9591-5893ae0647ff	1.00	PC_FX	2
03557b2e-16d1-491b-9d2d-fa7776d5fc49	f5e97692-61cc-4a20-b73c-c7077802c1bf	8da214a9-8fd9-41da-9c9e-136908d50845	1.00	M2	1
ca77b4aa-14cd-4f41-b3ad-c10f587fc66d	f5e97692-61cc-4a20-b73c-c7077802c1bf	ed860c7a-bf70-4ccc-9591-5893ae0647ff	1.00	PC_FX	2
00e4fa2a-d184-475b-8b22-93f8b52b56fd	3f14581f-bd05-40ea-8cc3-842480541498	5f6e23a7-b45d-47a9-ac03-a34aa00e6d44	1.00	M2	1
93308020-0c93-4a49-b79a-b98e8f1fb9e9	3f14581f-bd05-40ea-8cc3-842480541498	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
9a363951-f180-4021-876c-b5c5bd3de3dc	3f14581f-bd05-40ea-8cc3-842480541498	19180387-3c79-4e64-b538-905b4490d1bf	1.00	PC_FX	3
03c975d1-8359-40e1-831f-dc4060e5cd73	799b2ef3-32ed-4d48-8f65-db461fd4312c	cf4415fa-5c83-4eab-ac4b-12a6ea6183d3	1.00	PC_ML	2
77e8b1bb-7c80-4998-b4a1-c3439a7f39f1	799b2ef3-32ed-4d48-8f65-db461fd4312c	19180387-3c79-4e64-b538-905b4490d1bf	1.00	PC_FX	3
b4edae67-aa23-4c4d-bd02-a3ea0693dccd	a5b1048d-4b87-4f16-9f7c-068df483bc1c	cb343a39-f3b0-452f-b847-03c33e8da0c1	1.00	M2	1
03204876-ed29-4753-985d-9c3f1b0772f6	3853b555-2ce7-41a3-a5b1-2ddff50bd49a	f7d73fa2-9b7d-4094-93fd-7857a605fe09	1.00	M2	1
e28aad99-4e6d-45c2-ade7-cc7f7b8a4a8c	5a593998-6c8e-4f0d-9fd2-dd8b388f6fd8	97986e46-4190-4e4b-9923-61e3e299e9f3	1.00	M2	1
7e793662-3232-47ea-abd2-f78690db3b44	b39814ab-e028-4f71-8002-6bce051ffd05	c99d865e-6488-45f6-a3ff-6acd3796b1c6	1.00	M2	1
be0b0977-37a9-40e6-a27c-d758cba35cac	53597190-d977-41b3-a7f4-9f937815dd48	fa13d5d4-6248-44e3-b3d7-9b34ee0d23f8	1.00	M2	1
39924a94-b94c-498d-afff-a1612dfc5706	84133103-14aa-4b58-89ec-98cb933f0d82	cfe54c78-3b63-4c9b-9358-d5f2b2cea321	1.00	M2	1
194ec768-a205-4a0c-9c67-f014c1f4d134	63dbc326-8a48-4d77-a509-8979c570ebe5	d2ff6101-8841-445f-a5e8-abab1e770803	1.00	M2	1
76f6d549-d5fe-4127-a9ef-6f972976e8ef	2e5dd01f-0132-4218-9de5-7beede374046	d32ca098-5e1b-4de5-b19a-75fe7079359d	1.00	M2	1
b7e930d6-8900-4d29-8052-a6d3434bc9b4	cd0a91d8-e069-46dc-a51e-c8175d576c2d	f3cbc2d8-778a-4ca3-a2ca-cbd21b31ee10	1.00	M2	1
e555b11b-1c15-431b-897b-d01db7336648	149de49d-57e9-4cfa-afef-3976a7a5ce2c	f5678f24-99a0-421d-9f56-6bdf27da440f	1.00	M2	1
6397ed37-f6d4-472a-bddc-65615cfec660	6b9981c0-5789-48ef-96dc-29b38d694390	69612415-72eb-47e8-9e3f-603046ef95fd	1.00	M2	1
05170bbe-2c99-45bc-a62c-bd3c834c0cca	a097394b-4489-4fca-b4e4-22b90f6c793a	c3e82167-d8b8-40f4-afe0-ef4d4f520ea5	1.00	PC_ML	2
123c85d7-3589-4c39-baec-218f92fca608	3f55136f-1fa1-44f1-9e0f-8affe06ed4eb	c3e82167-d8b8-40f4-afe0-ef4d4f520ea5	1.00	PC_ML	2
add4f068-ea7d-4fd2-b80b-af9abf68bcb3	799b2ef3-32ed-4d48-8f65-db461fd4312c	9e46d0ed-b9c7-481a-b4b0-fe54e8e91b25	1.00	M2	1
\.


--
-- Data for Name: tabela_precos_fornecedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."tabela_precos_fornecedor" ("id", "empresa_id", "fornecedor_id", "produto", "unidade", "preco", "vigencia_inicio", "vigencia_fim", "criado_por", "criado_em", "atualizado_em") FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
nfe_xml	nfe_xml	\N	2026-05-19 01:03:41.401592+00	2026-05-19 01:03:41.401592+00	f	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 193, true);


--
-- Name: _keepalive_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."_keepalive_log_id_seq"', 41, true);


--
-- Name: pedido_compra_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pedido_compra_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict SVdwYLx4WW0oqhP6T8Sm1apTWVrCugRyNOIg2edPL5mhULHhDf5lhLrKtRM9i0s

RESET ALL;
