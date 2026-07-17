--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dictionary_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dictionary_entries (
    id bigint NOT NULL,
    meaning_en text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    meaning_ja text,
    example text,
    dictionary_word_id bigint NOT NULL,
    display_order integer NOT NULL
);


--
-- Name: dictionary_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dictionary_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dictionary_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dictionary_entries_id_seq OWNED BY public.dictionary_entries.id;


--
-- Name: dictionary_words; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dictionary_words (
    id bigint NOT NULL,
    word character varying(255) NOT NULL,
    normalized_word character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: dictionary_words_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dictionary_words ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.dictionary_words_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: guest_search_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_search_usage (
    id bigint NOT NULL,
    guest_id character varying(255) NOT NULL,
    usage_date date NOT NULL,
    base_limit integer DEFAULT 3 NOT NULL,
    bonus_count integer DEFAULT 0 NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bonus_used_count integer DEFAULT 0 NOT NULL
);


--
-- Name: guest_search_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guest_search_usage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guest_search_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guest_search_usage_id_seq OWNED BY public.guest_search_usage.id;


--
-- Name: user_search_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_search_usage (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    usage_date date NOT NULL,
    base_limit integer DEFAULT 10 NOT NULL,
    bonus_count integer DEFAULT 0 NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    bonus_used_count integer DEFAULT 0 NOT NULL
);


--
-- Name: user_search_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_search_usage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_search_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_search_usage_id_seq OWNED BY public.user_search_usage.id;


--
-- Name: user_words; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_words (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    word character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dictionary_word_id bigint
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying(255),
    password_hash text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    terms_version character varying(20),
    agreed_terms_at timestamp without time zone,
    auth_provider character varying DEFAULT 'email'::character varying NOT NULL,
    provider_user_id character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: words_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.words_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: words_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.words_id_seq OWNED BY public.user_words.id;


--
-- Name: dictionary_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionary_entries ALTER COLUMN id SET DEFAULT nextval('public.dictionary_entries_id_seq'::regclass);


--
-- Name: guest_search_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_search_usage ALTER COLUMN id SET DEFAULT nextval('public.guest_search_usage_id_seq'::regclass);


--
-- Name: user_search_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_search_usage ALTER COLUMN id SET DEFAULT nextval('public.user_search_usage_id_seq'::regclass);


--
-- Name: user_words id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_words ALTER COLUMN id SET DEFAULT nextval('public.words_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: dictionary_entries dictionary_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionary_entries
    ADD CONSTRAINT dictionary_entries_pkey PRIMARY KEY (id);


--
-- Name: dictionary_words dictionary_words_normalized_word_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionary_words
    ADD CONSTRAINT dictionary_words_normalized_word_key UNIQUE (normalized_word);


--
-- Name: dictionary_words dictionary_words_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionary_words
    ADD CONSTRAINT dictionary_words_pkey PRIMARY KEY (id);


--
-- Name: guest_search_usage guest_search_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_search_usage
    ADD CONSTRAINT guest_search_usage_pkey PRIMARY KEY (id);


--
-- Name: guest_search_usage unique_guest_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_search_usage
    ADD CONSTRAINT unique_guest_date UNIQUE (guest_id, usage_date);


--
-- Name: user_search_usage unique_user_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_search_usage
    ADD CONSTRAINT unique_user_date UNIQUE (user_id, usage_date);


--
-- Name: user_search_usage user_search_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_search_usage
    ADD CONSTRAINT user_search_usage_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: user_words words_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_words
    ADD CONSTRAINT words_pkey PRIMARY KEY (id);


--
-- Name: idx_dictionary_entries_dictionary_word_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dictionary_entries_dictionary_word_id ON public.dictionary_entries USING btree (dictionary_word_id);


--
-- Name: uq_dictionary_entries_word_id_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_dictionary_entries_word_id_display_order ON public.dictionary_entries USING btree (dictionary_word_id, display_order);


--
-- Name: users_provider_user_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_provider_user_id_unique ON public.users USING btree (provider_user_id) WHERE (provider_user_id IS NOT NULL);


--
-- Name: dictionary_entries fk_dictionary_entries_dictionary_word_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dictionary_entries
    ADD CONSTRAINT fk_dictionary_entries_dictionary_word_id FOREIGN KEY (dictionary_word_id) REFERENCES public.dictionary_words(id) ON DELETE CASCADE;


--
-- Name: user_search_usage fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_search_usage
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_words fk_words_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_words
    ADD CONSTRAINT fk_words_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_words words_dictionary_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_words
    ADD CONSTRAINT words_dictionary_word_id_fkey FOREIGN KEY (dictionary_word_id) REFERENCES public.dictionary_words(id);


--
-- PostgreSQL database dump complete
--


